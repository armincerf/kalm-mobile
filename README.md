This project was bootstrapped with [Create Expo CLJS App](https://github.com/jgoodhcg/create-expo-cljs-app).

## Developing
- Find and replace all occurrences of `new-project-name` and `new_project_name` with their kebab and snake case equivalents for your new project

- Install all deps
```
$ yarn
```

- Start shadow-cljs
```
$ shadow-cljs watch app
;; Wait for first compile to finish or expo gets confused
```

- (In another terminal) Start expo
```
$ yarn start
```

## Production Builds
```
$ shadow-cljs release app
$ expo build
;; optionally expo publish if a build already exists to OTA update to
```

## Tests

To run handler and subscriptions tests using `cljs.test`
```
$ shadow-cljs watch test
```

You can find an example of using `jest` to test `react-native` apps here.

- https://github.com/mynomoto/reagent-expo/tree/jest-test

## Useful resources
    
Clojurians Slack http://clojurians.net/.

CLJS FAQ (for JavaScript developers) https://clojurescript.org/guides/faq-js.

Official CLJS API https://cljs.github.io/api/.

Quick reference https://cljs.info/cheatsheet/.

Offline searchable docs https://devdocs.io/.

VSCode plugin https://github.com/BetterThanTomorrow/calva.


