# Antares Chat Reference Example

> npm start 

View in browser at [http://localhost:3140](http://localhost:3140)

Open two browsers. Click 'Start Conversation' in one of them. Toggle the view to 'Other' in one of them.
Observe messages and typing notifications flying back and forth. Includes some simulated latency, 
demonstrates the use of Optimistic UI.

## Hosting: Heroku

```
heroku buildpacks:set https://github.com/jordansissel/heroku-buildpack-meteor.git
```

Full Instructions here: https://github.com/jordansissel/heroku-buildpack-meteor

## Developer Notes: 

There's a symlink to a sibling directory called `antares` to pick up the 
meteor package, or the most recent compatible version from [atmosphere](https://atmospherejs.com/deanius/antares) will be used.
