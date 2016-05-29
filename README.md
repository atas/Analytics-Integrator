Analytics-Integrator
====================

Integrates Google Analytics with social media events on your pages.

Latest version .js file: [gai-0.3.js](js/gai-0.3.js) and minified [gai-0.3.min.js](js/gai-0.3.min.js)


## Full Features:

* Automatically integrates with Facebook widgets and like/unlike, send message or comment add/remove tracking
* Automatically integrates with Twitter buttons and tweet/follow tracking
* Automatically integrates with YouTube videos and start/stop/finish tracking
* LinkedIn “successful sharing” tracking
* Page scroll tracking
* Duration on the page tracking
* Outgoing (external) links click tracking
* Outgoing (external) social links click tracking (as social events, not links)
* Mailto links click tracking
* Store all social interaction into and access later (Premium feature)
  (like did user like any page during this or in all visits?)
* Integrate into social events with callbacks
* Optimized to be async and does not slow down your page!

*ps: Google+ integrates with Analytics automatically, so Analytics Integrator doesn’t need to track it.*

## Integration

* Requires JQuery to be present on the pge
* Just put the code below anywhere after JQuery
* <script async src="url-to-gai.js"></script>
* no configuration is necessary for default settings.
* LinkedIn: special case. Please add 
data-onsuccess="_gaiLinkedInSuccessfulShare"
attribute into the `<script type="IN/Share"…>` tag if you want to track LinkedIn. 
* All others work automatically!

## Default settings

Events or social interactions will be send on these interactions:

* Facebook like/unlike, send message or comment add/remove
* Twitter tweet/follow
* YouTube video start/stop/finish
* Duration event on 30th second, 1st 3rd and 5th minutes.
* Outgoing (external) link clicks only if they open in a new window (target=_blank)
* Mailto link clicks

## Page scroll events default settings

Initially page scroll event point is set by according to one of these criteria below. If the document height is:

* greater than 3 times browser height, on 50% and 90% of the document
* greater than 2 times browser height, on 80% of the document
* or greater than 1.2 times browser height, on 95% of the document


## Overriding default settings
You need to define `_gaicnf` object in `<script>` tags before loading the gai.js (and after or before jQuery). There’s a full sample of `_gaicnf` structure is:

```javascript
var _gaicnf =  {
facebookTracking: false,
twitterTracking: false,
externalLinkTracking: false,
//duration events on these seconds
durationEvents: [60, 180, 300],
scrollEvents: ['60%', '.comments', '#contactForm'],
callback: gaijsLoaded, //called when gaijs is loaded
externalLinkEventCategory: "Click",
externalLinkEventAction: "External Link",
duationEventCategory: "Activity",
durationEventAction: "Staying"
};
```

You don’t need to define all of the elements of _gaicnf. i.e. you can just disable facebook alone with 
`var _gaicnf = { facebookTracking: false };`

## Debug Mode

You can set the debug mode on to see all activities sent to Analytics in the console. To do it, open the console (F12 > console) and type `GAI.Debug = true;` -note it’s case-sensitive. Alternatively, You can set a cookie with the name gaiDebug to “1” to make the debug mode open in every page automatically.

## Accessing Social Events History
```javascript
var likesSession = GAI.Storage.likes.getSessionCount();
var likesAll = GAI.Storage.likes.getLocalCount();
```

Replace “likes” keyword with these to get others: fbSentMsgs, tweets, follows, linkedInShares.

## Subscribe to Events

```javascript
GAI.Subscriptions.subscribeLikes(function(){
alert('facebook like event triggered');
}
```

And replace Likes in “subscribeLikes” with these for others: Unlikes, Tweets, Follows, LinkedinShares, FbSendMsg
