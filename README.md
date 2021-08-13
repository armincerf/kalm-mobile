## Developing
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

You can run `yarn dev` to start both the shadow process and expo processes at the same time, but only do this if you have an existing shadow build (e.g you've run `shadow-cljs watch app` at least once before)

## Production Builds
```
$ shadow-cljs release app
$ expo build
;; optionally just yarn pub if a build already exists to OTA update to
```

## Useful resources

Blog relating to this repo https://www.juxt.pro/blog/clojurescript-native-apps-2021
    
Resources for using React Native with CLJS https://cljsrn.org/

Clojurians Slack http://clojurians.net/.

CLJS FAQ (for JavaScript developers) https://clojurescript.org/guides/faq-js.

Official CLJS API https://cljs.github.io/api/.

Quick reference https://cljs.info/cheatsheet/.
