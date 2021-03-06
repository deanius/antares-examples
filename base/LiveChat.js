import React from 'react'
import { Map } from 'immutable'
import { connect } from 'react-redux'
import { announce, originate } from './antares'
import Actions from './actions'

// The 4 parts of this file:
//  1. The definition of mapStateToProps
//  2. The definition of mapDispatchToProps
//  3. The component
//  4. The export of the connect-wrapped component

// Selects the slice of state to be shown in the UI, as a plain JS object
// The component props combine both antares data (shared for all clients)
// and view data, particular to each client.
// Shape: 
//   messages: [{message, sentAt, sentByMe}]
//   currentSender: String
//   typingNotification: truthy
const mapStateToProps = (state) => {
    const persistedChatData = (state.antares.getIn(['Chats', 'chat:demo']) || new Map())
    const currentSender = state.view.get('viewingAs')

    return persistedChatData
        // slightly dirty - modify the messages to have a flag
        .update('messages', markMyMessages(currentSender))
        .merge({
            currentSender,
            isTyping: state.view.getIn(['activity', 'isTyping'])
        })
        .toJS()
}

// Given the currentSender using this chat, returns a function which
// updates messages' sentByMe property
function markMyMessages(currentSender) {
    return messages => messages && messages.map((message) => {
        return message.set('sentByMe', (message.get('sender') === currentSender))
    })
}

// Handlers which will be injected into our components as props
// We actually use announce instead of dispatch, however
const mapDispatchToProps = () => ({
    sendChat(action) {
        return announce(action)
    },
    archiveChat() {
        announce(Actions.Chat.archive)
    }
})

class _LiveChat extends React.Component {
    constructor(props) {
        super(props)
        this.state = { inProgressMessage: '' }
        this.handleTyping = this.handleTyping.bind(this)
        this.handleSend = this.handleSend.bind(this)
        this.handleKeyPress = this.handleKeyPress.bind(this)
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            this.handleSend()
        }
    }

    handleTyping(event) {
        // Tell React of the new value to render in the input
        this.setState({ inProgressMessage: event.target.value })

        // Announce one of these events (locally) on every change
        announce(Actions.Activity.type, { sender: this.props.currentSender })
    }

    handleSend() {
        let action
        // Client-side validation will run upon constructing the action,
        // throwing an exception if it doesn't pass Type checks
        try {
            action = originate(Actions.Message.send, {
                message: this.state.inProgressMessage,
                sender: this.props.currentSender
            })
        } catch (err) {
            alert(err.message)
            return
        }        

        let originalMessage = this.state.inProgressMessage
        let sendPromise = this.props.sendChat(action)
        sendPromise.catch((err) => {
            // tell the reducers to mark this one as bad
            announce({
                type: 'Message.send.error',
                payload: err,
                meta: {
                    antares: {
                        key: ['Chats', 'chat:demo'],
                        localOnly: true
                    }
                }
            })

            // revert the message if we got a server error
            this.setState({ inProgressMessage: originalMessage })
        })

        // If we made it this far - clear the message - it'll be restored
        // in the event of server error
        this.setState({ inProgressMessage: '' })
    }

    render() {
        let { currentSender, messages = [], isTyping } = this.props
        return (
            <div>
                <div className="sm">
                    View As: <b>{currentSender}</b> &nbsp;|&nbsp;
                    <a
                      href="#change-sides"
                      onClick={(e) => {
                          announce(Actions.View.changeSides)
                          e.preventDefault()
                      }}
                    >{currentSender === 'Self' ? 'Other' : 'Self'}</a>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <button
                      style={{ position: 'relative', top: -1 }}
                      onClick={(e) => {
                          announce(Actions.Chat.start)
                          announce(Actions.Message.send, { message: 'Hello!', sender: 'Self' })
                          announce(Actions.Message.send, { message: 'Sup.', sender: 'Other' })
                          e.preventDefault()
                      }}
                    >Start/Restart Chat ⟳</button>
                </div>
                <div className="instructions">
                    Messages shorter than 2 chars raise a client error.
                    Messages containing &apos;server error&apos; raise a server error.
                </div>

                <div className="messages">
                    {messages.map(msg => (
                        <div
                          key={Math.floor(Math.random() * 10000)}
                          className={'msg msg-' + (msg.sentByMe ? 'mine' : 'theirs')}
                          title={msg.error ? 'Your message was not delivered' : 'Sent at: ' + msg.sentAt}
                        >{msg.message}
                        { msg.error && ' ⚠️' }    
    
                        </div>
                    ))}
                </div>

                {
                    // a compound expression evaluating to the typing indicator
                    // if all the conditions are met
                    isTyping &&
                    Object.keys(isTyping).length > 0 &&
                    !isTyping[currentSender] &&
                    <div className="msg msg-theirs"><i>. . .</i></div>
                }

                <div className="inProgressMessage">
                    <textarea
                      rows="2" cols="50"
                      value={this.state.inProgressMessage}
                      onChange={this.handleTyping}
                      onKeyPress={this.handleKeyPress}
                    />
                    <br />
                    <button onClick={this.handleSend}>Send ➩</button>
                </div>
            </div>
        )
    }
}

// We actually use announce instead of dispatch, however
export const LiveChat = connect(mapStateToProps, mapDispatchToProps)(_LiveChat)

