
declare var window: any;
declare var _gaq: Array;
declare var YT: any;

if (typeof jQuery == 'undefined')
    console.log('GAI: jQuery is not loaded!');
else
    jQuery(function () {
        window.gaiManager = new GAI.Manager(window._gaicnf || {});
    });


function _gaiLinkedInSuccessfulShare(d) {
    GAI.Storage.linkedInShares.make();
    GAI.Subscriptions.invokeLinkedInShares();
    GAI.Ops().sendSocialEvent("LinkedIn", "Successful share", d);
}

function _gaiGooglePlusOne(d) {
}


module GAI {

    export var Debug: boolean = false;

    export var $: JQueryStatic;

    export interface IOperations {
        sendEvent(category: string, action: string, label: string, value?: any);
        sendSocialEvent(socialNetwork: string, socialAction: string, socialTarget: string);
    }

    //Operations for ga.js
    class GajsOperations implements IOperations {
        sendEvent(category: string, action: string, label: string, value?: number) {
            Log('Event category: ' + category + ", action: " + action + ", label: " + label + ', ' + value);
            ga('send', 'event', category, action, label, value);
        }

        sendSocialEvent(socialNetwork: string, socialAction: string, socialTarget: string) {
            Log('Social interaction on ' + socialNetwork + " for " + socialAction + " on " + socialTarget);
            ga('send', 'social', socialNetwork, socialAction, socialTarget);
        }
    }

    //Operations for analytics.js
    class AjsOperations implements IOperations {
        sendEvent(category: string, action: string, label?: string, value?: number) {
            Log('Event category: ' + category + ", action: " + action + ", label: " + label + ', ' + value);
            _gaq.push(['_trackEvent', category, action, label, value]);
        }

        sendSocialEvent(socialNetwork: string, socialAction: string, socialTarget: string) {
            Log('Social interaction on ' + socialNetwork + " for " + socialAction + " on " + socialTarget);
            _gaq.push(['_trackSocial', 'social', socialNetwork, socialAction, socialTarget]);
        }
    }

    //Null operations (if no analytics javascript is available)
    class NullOperations implements IOperations {
        sendEvent(category: string, action: string, label: string = window.undefined, value: any = window.undefined) {
            NullOperations.error();
        }

        sendSocialEvent(socialNetwork: string, socialAction: string, socialTarget: string) {
            NullOperations.error();
        }

        private static error() {
            window.console.log('Google Analytics javascript is not loaded.');
        }
    }

    declare var _opsCache: IOperations;

    //Get an IOperations object
    export function Ops(): IOperations {
        if (typeof _opsCache != "undefined")
            return _opsCache;

        if (typeof ga == "function") {
            _opsCache = new GajsOperations();
            return _opsCache;
        }

        if (typeof _gaq == "object") {
            _opsCache = new AjsOperations();
            return _opsCache;
        }

        return new NullOperations();
    }

    export function Log(text: string) {
        if (Debug)
            window.console.log("GAI: " + text);
    }

    function GetCookie(cName) {
        var cValue = window.document.cookie;
        var cStart = cValue.indexOf(" " + cName + "=");
        if (cStart == -1) {
            cStart = cValue.indexOf(cName + "=");
        }
        if (cStart == -1) {
            cValue = null;
        }
        else {
            cStart = cValue.indexOf("=", cStart) + 1;
            var cEnd = cValue.indexOf(";", cStart);
            if (cEnd == -1) {
                cEnd = cValue.length;
            }
            cValue = window.unescape(cValue.substring(cStart, cEnd));
        }
        return cValue;
    }

    class SocialAction {
        //Starting urls to match without http:// or https://
        public urls: string[];
        public network: string;
        public action: string;

        constructor(urls: string[], network: string, action: string) {
            this.urls = urls;
            this.network = network;
            this.action = action;
        }
    }

    class SocialAnalyzer {

        private elem: JQuery;

        public network: string;
        public action: string;
        public target: string;

        public isSocial: boolean = false;

        public static matches: SocialAction[] = [
            new SocialAction(["facebook.com/sharer", "www.facebook.com/sharer"], "Facebook", "Share"),
            new SocialAction(["facebook.com/", "www.facebook.com/"], "Facebook", "Click"),
            new SocialAction(["twitter.com/intent"], "Twitter", "Tweet"),
            new SocialAction(["twitter.com"], "Twitter", "Click"),
            new SocialAction(["www.linkedin.com/cws/", "linkedin.com/cws/"], "LinkedIn", "Share"),
            new SocialAction(["www.linkedin.com"], "LinkedIn", "Click"),
            new SocialAction(["plus.google.com/share"], "Google+", "Share"),
            new SocialAction(["plus.google.com/"], "Google+", "Click"),
        ];


        constructor(elem: JQuery) {
            this.elem = elem;
            this.analyze();
        }

        private analyze() {
            var href = this.elem.attr('href');
            var nonHttpHref = href.replace(/^http[s]?:\/\//, '');

            $.each(SocialAnalyzer.matches, (i, v) => {
                $.each(v.urls, (i2, v2) => {
                    if (this.isSocial == false && nonHttpHref.indexOf(v2) == 0) {
                        this.network = v.network;
                        this.action = v.action;
                        this.target = href;
                        this.isSocial = true;
                        return;
                    }
                });
            });

        }


        static getQueryVariable(variable, url) {

            var qs = url.split('?');

            if (qs.length < 2)
                return null;

            var query = qs[1];
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == variable) {
                    return pair[1];
                }
            }

            return null;
        }

    }

    //Coverts seconds to human-readable format, i.e. 1 minute, 2 minutes 30 seconds.
    function ReadableSeconds(seconds: number) {

        if (seconds == 0 || seconds == 1)
            return this.seconds + " second";

        var secs = seconds % 60;
        var mins = window.parseInt(seconds / 60);

        var pluralS = (i) => i > 1 ? "s" : "";

        var msg = "";

        if (mins > 0)
            msg += mins + " minute" + pluralS(mins);

        if (mins > 0 && secs > 0)
            msg += ", ";

        if (secs > 0)
            msg += secs + " second" + pluralS(secs);

        return msg;
    }

    class SocialBinder {

        public static facebookBound: boolean = false;
        public static twitterBound: boolean = false;

        public static bindFacebook() {

            if (SocialBinder.facebookBound || typeof window.FB == "undefined")
                return;
            Log('Facebook bound');

            SocialBinder.facebookBound = true;

            window.FB.Event.subscribe('edge.create', (href, widget) => {
                Storage.likes.make();
                Subscriptions.invokeLikes();
                Ops().sendSocialEvent("Facebook", "Like", href);
            });

            window.FB.Event.subscribe('edge.remove', (href, widget) => {
                Storage.likes.unmake();
                Subscriptions.invokeUnlikes();
                Ops().sendSocialEvent("Facebook", "Unlike", href);
            });

            window.FB.Event.subscribe('comment.create', (href, commentId) => {
                Ops().sendSocialEvent("Facebook", "Add comment", href);
            });

            window.FB.Event.subscribe('comment.remove', (href, commentId) => {
                Ops().sendSocialEvent("Facebook", "Remove comment", href);
            });

            window.FB.Event.subscribe('message.send', (href) => {
                Storage.fbSentMsgs.make();
                Subscriptions.invokeFbSendMsg();
                Ops().sendSocialEvent("Facebook", "Send message", href);
            });
        }

        public static bindTwitter() {

            if (SocialBinder.twitterBound || typeof window.twttr == "undefined")
                return;

            Log('Twitter bound');

            SocialBinder.twitterBound = true;

            window.twttr.events.bind('tweet', (e) => {
                Storage.tweets.make();
                Subscriptions.invokeTweets();
                Ops().sendSocialEvent("Twitter", "Tweet", "Tweet");
            });
            window.twttr.events.bind('follow', (e) => {
                Storage.follows.make();
                Subscriptions.invokeFollows();
                Ops().sendSocialEvent("Twitter", "Follow", "@" + e.data.screen_name);
            });
        }
    }

    export interface IScrollTrackerElem {
        value: any;
        label: string;
        offset: number;
    }


    export class StorageElement {
        private key: string;

        constructor(storageKey: string) {
            this.key = storageKey;
        }

        public make() {
            StorageElement.additionLocal(this.key, 1);
            StorageElement.additionSession(this.key, 1);
        }

        public unmake() {
            StorageElement.additionLocal(this.key, -1);
            StorageElement.additionSession(this.key, -1);
        }

        public getLocalCount(): number {
            return StorageElement.getLocalInt(this.key);
        }

        public getSessionCount(): number {
            return StorageElement.getSessionInt(this.key);
        }

        private static getLocalInt(elem: string) {
            if (window.localStorage.getItem('gai_' + elem) === null)
                window.localStorage.setItem('gai_' + elem, '0');

            return window.parseInt(window.localStorage.getItem('gai_' + elem));
        }

        private static additionLocal(elem: string, add: number) {
            var likes = StorageElement.getLocalInt(elem);
            StorageElement.setLocalInt(elem, likes + add);
        }

        private static setLocalInt(elem: string, value: number) {
            window.localStorage.setItem('gai_' + elem, value);
        }

        private static getSessionInt(elem: string): number {

            if (window.sessionStorage.getItem('gai_' + elem) === null)
                window.sessionStorage.setItem('gai_' + elem, '0');

            return window.parseInt(window.sessionStorage.getItem('gai_' + elem));
        }

        private static setSessionInt(elem: string, value: number) {
            window.sessionStorage.setItem('gai_' + elem, value);
        }

        private static additionSession(elem: string, add: number) {
            var likes = StorageElement.getSessionInt(elem);
            StorageElement.setSessionInt(elem, likes + add);
        }
    }

    export class Storage {
        public static likes: StorageElement = new StorageElement('likes');
        public static fbSentMsgs: StorageElement = new StorageElement('fbSentMsgs');
        public static tweets: StorageElement = new StorageElement('tweets');
        public static follows: StorageElement = new StorageElement('follows');
        public static linkedInShares: StorageElement = new StorageElement('linkedInShares');
    }


    class ScrollTracker {

        private trackValues: IScrollTrackerElem[] = [];

        public addTrack(value, label?: string, offset: number = 0) {
            if (/(\.|#)[a-zA-Z0-9_\-]+/.test(value) == false && /[0-9]+%/.test(value) == false) {
                window.console.log('The value you want to track is not understood: ' + value);
                return;
            }

            this.trackValues.push({
                value: value,
                label: label || value,
                offset: offset
            });
        }

        private getOffset(elemId: number) {
            var elem = this.trackValues[elemId];

            if (elem.value.indexOf('%') > 0) {
                return $(window.document).height() * window.parseInt(elem.value) / 100 - elem.offset;
            }

            var jElem = $(elem.value);

            if (jElem.length > 0)
                return jElem.offset().top - elem.offset;
            else
                return null;
        }

        //Send Analytics event, also remove the elem from scroll track list
        private sendEvent(elemId: number) {
            var elem = this.trackValues[elemId];

            this.trackValues.splice(elemId, 1);

            Ops().sendEvent('Interaction', 'Scroll', elem.label);
        }

        public tick() {
            var windowPos = $(window).scrollTop() + $(window).height();

            for (var i = 0; i < this.trackValues.length; i++) {
                var offsetTop = this.getOffset(i);

                if (windowPos >= offsetTop)
                    this.sendEvent(i);
            }
        }

    }

    interface IYoutubeTrackerElem {
        iframe: JQuery;
        YoutubeApi: any;
    }

    interface IYoutubeStateChange {
        target: any;
        data: number; //1: continue, 2: stop, 0: end, 3: start
    }

    class YoutubeTracker {

        private iframeApiLoaded: boolean = false;

        private players: IYoutubeTrackerElem[] = [];

        private processedIframes: HTMLIFrameElement[] = [];

        private getYoutubeIframes(): HTMLIFrameElement[] {
            var iframes: HTMLIFrameElement[] = [];

            var tags: HTMLIFrameElement[] = window.document.getElementsByTagName('iframe');

            for (var i = 0; i < tags.length; i++) {
                var e = tags[i];

                try {
                    var src = (<any>e).src;

                    if (/^https?:\/\/www\.youtube.com\/embed\//.test(src)) {
                        iframes.push(e);
                    }
                }
                catch (e) {
                    window.console.log("Can't get iframe url");
                }
            }

            return iframes;
        }

        public tick() {
            var ytIframes = this.getYoutubeIframes();

            if (ytIframes.length == 0)
                return;

            this.includeYoutubeApiJs();

            if (typeof window.YT != 'undefined') {
                $('iframe').each((i, e) => {

                    try {
                        var src = (<any>e).src;
                    }
                    catch (e) {
                        window.console.log("Can't get iframe src");
                        return;
                    }

                    if (/^https?:\/\/www\.youtube.com\/embed\//.test(src)) {
                        this.generatePlayerObject(e);
                    }
                });
            }
        }

        private youtubeStateChange(e: IYoutubeStateChange) {
            var url = e.target.getVideoUrl();
            var duration = e.target.getDuration();
            var currentTime = e.target.getCurrentTime();

            var watchedPercent: number = window.parseInt((100 * currentTime) / duration);

            if (e.data == 0) {
                Ops().sendEvent("Video", "End Watching", url);
            }
            else if (e.data == 2 && watchedPercent < 100) {
                Ops().sendEvent("Video", "Stop", url, watchedPercent);
            }
        }

        private static youtubeStateValue(data: number) {
            if (data == 0) return "End";

            switch (data) {
                case 0:
                    return 'End';
                case 1:
                    return 'Continue';
                case 2:
                    return 'Stop';
                case 3:
                    return 'Start';
            };

            return null;
        }

        private generatePlayerObject(elem) {
            if (this.players.indexOf(elem) >= 0)
                return;

            if (this.processedIframes.indexOf(elem) >= 0)
                return;

            this.processedIframes.push(elem);

            try {
                Log('Creating YouTube Iframe API Object');

                var player = new YT.Player(elem, {
                    events: {
                        'onStateChange': this.youtubeStateChange
                    }
                });

                this.players.push({
                    iframe: elem,
                    YoutubeApi: player
                });
            }
            catch (e) {
            }
        }

        private includeYoutubeApiJs() {

            if (this.iframeApiLoaded == true || typeof window.YT != 'undefined')
                return;

            Log('Including YouTube Iframe API');

            this.iframeApiLoaded = true;
            $.getScript("//www.youtube.com/iframe_api");
        }
    }

    class SubscriptionCollection {
        private funcs: Function[] = [];

        public add(func: Function) {
            this.funcs.push(func);
        }

        public invoke() {
            for (var i = 0; i < this.funcs.length; i++) {
                this.funcs[i]();
            }
        }
    }

    export class Subscriptions {

        private static Likes: SubscriptionCollection = new SubscriptionCollection();
        private static Unlikes: SubscriptionCollection = new SubscriptionCollection();
        private static Tweets: SubscriptionCollection = new SubscriptionCollection();
        private static Follows: SubscriptionCollection = new SubscriptionCollection();
        private static LinkedinShares: SubscriptionCollection = new SubscriptionCollection();
        private static FbSendMsg: SubscriptionCollection = new SubscriptionCollection();

        public static subscribeLikes(func: Function) {
            Subscriptions.Likes.add(func);
        }

        public static invokeLikes() {
            Subscriptions.Likes.invoke();
        }

        public static subscribeUnlikes(func: Function) {
            Subscriptions.Unlikes.add(func);
        }

        public static invokeUnlikes() {
            Subscriptions.Unlikes.invoke();
        }

        public static subscribeTweets(func: Function) {
            Subscriptions.Tweets.add(func);
        }

        public static invokeTweets() {
            Subscriptions.Tweets.invoke();
        }

        public static subscribeFollows(func: Function) {
            Subscriptions.Follows.add(func);
        }

        public static invokeFollows() {
            Subscriptions.Follows.invoke();
        }

        public static subscribeLinkedInShares(func: Function) {
            Subscriptions.LinkedinShares.add(func);
        }

        public static invokeLinkedInShares() {
            Subscriptions.LinkedinShares.invoke();
        }

        public static subscribeFbSendMsg(func: Function) {
            Subscriptions.FbSendMsg.add(func);
        }

        public static invokeFbSendMsg() {
            Subscriptions.FbSendMsg.invoke();
        }
    }


    export interface IConfiguration {
        facebookTracking: boolean;
        twitterTracking: boolean;
        externalLinkTracking: boolean;
        durationEvents: number[];
        scrollEvents: IScrollTrackerElem[];

        callback: Function;
        externalLinkTimeout: number;
        externalLinkEventCategory: string;
        externalLinkEventAction: string;
        durationEventCategory: string;
        durationEventAction: string;
    }

    // The manager class
    export class Manager {
        private scrollTracker: ScrollTracker = new ScrollTracker();
        private config: IConfiguration;

        private instantiateTime: Date = new window.Date();

        private YoutubeTracker: YoutubeTracker = new YoutubeTracker();

        private tickCounter: number = 0;

        constructor(config: IConfiguration) {

            $ = window.jQuery;

            this.config = {
                facebookTracking: config.facebookTracking || true,
                twitterTracking: config.twitterTracking || true,
                externalLinkTracking: config.externalLinkTracking || true,
                durationEvents: config.durationEvents || [30, 60, 180, 300],
                scrollEvents: config.scrollEvents || this.smartScrollEvents(),
                callback: config.callback || null,
                externalLinkTimeout: config.externalLinkTimeout || 500,
                externalLinkEventCategory: config.externalLinkEventCategory || "Click",
                externalLinkEventAction: config.externalLinkEventAction || "External Link",
                durationEventCategory: config.durationEventCategory || "Activity",
                durationEventAction: config.durationEventAction || "Staying"
            };

            if (this.config.externalLinkTracking == true)
                this.trackExternalLinks();

            $.each(this.config.scrollEvents, (i, v) => {
                if (typeof v == "string")
                    this.scrollEvent(<string><any>v);
                else
                    this.scrollEvent(v.value, v.label, v.offset);
            });

            $.each(this.config.durationEvents, (i, v) => this.durationEvent(v));

            if (typeof this.config.callback == "function")
                this.config.callback();

            this.tick();

            if (window.location.hostname == 'localhost' || GetCookie('gaiDebug') == '1')
                Debug = true;
        }

        public scrollEvent(elem: string, label?: string, offset: number = 0): void {
            this.scrollTracker.addTrack(elem, label, offset);
        }

        public durationEvent(seconds: number) {
            window.setTimeout(() => {
                Ops().sendEvent(this.config.durationEventCategory, this.config.durationEventAction, ReadableSeconds(seconds));
            }, seconds * 1000);
        }

        private smartScrollEvents() {
            var w = $(window).height();
            var d = $(window.document).height();


            if (d > w * 3)
                return ['50%', '90%'];
            if (d > w * 2)
                return ['80%'];
            if (d > w * 1.2)
                return ['95%'];

            return [];
        }

        private trackExternalLinks() {
            //Link click event (mouse down actually)
            var linkClickEvent = (elem: JQuery) => {

                elem.one('mousedown', () => {
                    var href = elem.attr('href');
                    href = href.replace(/^http[s]?:\/\//, '');

                    var host = href.split('/')[0];

                    if (host == window.host)
                        return;

                    var eventCategory = elem.attr('data-gai-event-category') || this.config.externalLinkEventCategory;
                    var eventAction = elem.attr('data-gai-event-action') || this.config.externalLinkEventAction;
                    var eventLabel = elem.attr('data-gai-event-label') || href;

                    var socialAnalyzer = new SocialAnalyzer(elem);

                    if (socialAnalyzer.isSocial) {
                        Ops().sendSocialEvent(socialAnalyzer.network, socialAnalyzer.action, socialAnalyzer.target);
                    }
                    else {
                        Ops().sendEvent(eventCategory, eventAction, eventLabel);
                    }

                    //Put timeout for on click event if this is neither a _blank link nor mailto:
                    if (elem.attr('target') != '_blank' || href.indexOf('mailto:') == 0) {
                        elem.click(function (e) {
                            e.preventDefault();
                        });
                        window.setTimeout('document.location = "' + href + '"', this.config.externalLinkTimeout);
                    }
                });
            };

            $('a[target="_blank"], a[href^="mailto:"]').each(function () {
                var href = $(this).attr('href');

                if (typeof href == "undefined" || href == "" || href == "#" || /^javascript:/.test(href))
                    return;

                //Either an external link, or a mailto link match
                if (/^https?:\/\//.test(this.href) || this.href.indexOf('mailto:') == 0) {
                    linkClickEvent($(this));
                }
            });
        }

        private tick() {
            window.setInterval(() => {
                this.tickCounter++;

                if (this.config.facebookTracking && !SocialBinder.facebookBound) SocialBinder.bindFacebook();
                if (this.config.twitterTracking && !SocialBinder.twitterBound) SocialBinder.bindTwitter();

                this.scrollTracker.tick();


                if (new Date().getTime() - this.instantiateTime.getTime() > 1000 && this.tickCounter % 8 == 0) {
                    this.YoutubeTracker.tick();
                }

            }, 500);
        }

    }

}
