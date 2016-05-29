if (typeof jQuery == 'undefined')
    console.log('GAI: jQuery is not loaded!');

function _gaiLinkedInSuccessfulShare(d) {
    GAI.Storage.linkedInShares.make();
    GAI.Subscriptions.invokeLinkedInShares();
    GAI.Ops().sendSocialEvent("LinkedIn", "Successful share", d);
}

function _gaiGooglePlusOne(d) {
}

var GAI;
(function (GAI) {
    GAI.Debug = false;

    GAI.$;

    //Operations for ga.js
    var GajsOperations = (function () {
        function GajsOperations() {
        }
        GajsOperations.prototype.sendEvent = function (category, action, label, value) {
            Log('Event category: ' + category + ", action: " + action + ", label: " + label + ', ' + value);
            ga('send', 'event', category, action, label, value);
        };

        GajsOperations.prototype.sendSocialEvent = function (socialNetwork, socialAction, socialTarget) {
            Log('Social interaction on ' + socialNetwork + " for " + socialAction + " on " + socialTarget);
            ga('send', 'social', socialNetwork, socialAction, socialTarget);
        };
        return GajsOperations;
    })();

    //Operations for analytics.js
    var AjsOperations = (function () {
        function AjsOperations() {
        }
        AjsOperations.prototype.sendEvent = function (category, action, label, value) {
            Log('Event category: ' + category + ", action: " + action + ", label: " + label + ', ' + value);
            _gaq.push(['_trackEvent', category, action, label, value]);
        };

        AjsOperations.prototype.sendSocialEvent = function (socialNetwork, socialAction, socialTarget) {
            Log('Social interaction on ' + socialNetwork + " for " + socialAction + " on " + socialTarget);
            _gaq.push(['_trackSocial', 'social', socialNetwork, socialAction, socialTarget]);
        };
        return AjsOperations;
    })();

    //Null operations (if no analytics javascript is available)
    var NullOperations = (function () {
        function NullOperations() {
        }
        NullOperations.prototype.sendEvent = function (category, action, label, value) {
            if (typeof label === "undefined") { label = window.undefined; }
            if (typeof value === "undefined") { value = window.undefined; }
            NullOperations.error();
        };

        NullOperations.prototype.sendSocialEvent = function (socialNetwork, socialAction, socialTarget) {
            NullOperations.error();
        };

        NullOperations.error = function () {
            window.console.log('Google Analytics javascript is not loaded.');
        };
        return NullOperations;
    })();

    //Get an IOperations object
    function Ops() {
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
    GAI.Ops = Ops;

    function Log(text) {
        if (GAI.Debug)
            window.console.log("GAI: " + text);
    }
    GAI.Log = Log;

    function GetCookie(cName) {
        var cValue = window.document.cookie;
        var cStart = cValue.indexOf(" " + cName + "=");
        if (cStart == -1) {
            cStart = cValue.indexOf(cName + "=");
        }
        if (cStart == -1) {
            cValue = null;
        } else {
            cStart = cValue.indexOf("=", cStart) + 1;
            var cEnd = cValue.indexOf(";", cStart);
            if (cEnd == -1) {
                cEnd = cValue.length;
            }
            cValue = window.unescape(cValue.substring(cStart, cEnd));
        }
        return cValue;
    }

    var SocialAction = (function () {
        function SocialAction(urls, network, action) {
            this.urls = urls;
            this.network = network;
            this.action = action;
        }
        return SocialAction;
    })();

    var SocialAnalyzer = (function () {
        function SocialAnalyzer(elem) {
            this.isSocial = false;
            this.elem = elem;
            this.analyze();
        }
        SocialAnalyzer.prototype.analyze = function () {
            var _this = this;
            var href = this.elem.attr('href');
            var nonHttpHref = href.replace(/^http[s]?:\/\//, '');

            GAI.$.each(SocialAnalyzer.matches, function (i, v) {
                GAI.$.each(v.urls, function (i2, v2) {
                    if (_this.isSocial == false && nonHttpHref.indexOf(v2) == 0) {
                        _this.network = v.network;
                        _this.action = v.action;
                        _this.target = href;
                        _this.isSocial = true;
                        return;
                    }
                });
            });
        };

        SocialAnalyzer.getQueryVariable = function (variable, url) {
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
        };
        SocialAnalyzer.matches = [
            new SocialAction(["facebook.com/sharer", "www.facebook.com/sharer"], "Facebook", "Share"),
            new SocialAction(["facebook.com/", "www.facebook.com/"], "Facebook", "Click"),
            new SocialAction(["twitter.com/intent"], "Twitter", "Tweet"),
            new SocialAction(["twitter.com"], "Twitter", "Click"),
            new SocialAction(["www.linkedin.com/cws/", "linkedin.com/cws/"], "LinkedIn", "Share"),
            new SocialAction(["www.linkedin.com"], "LinkedIn", "Click"),
            new SocialAction(["plus.google.com/share"], "Google+", "Share"),
            new SocialAction(["plus.google.com/"], "Google+", "Click")
        ];
        return SocialAnalyzer;
    })();

    //Coverts seconds to human-readable format, i.e. 1 minute, 2 minutes 30 seconds.
    function ReadableSeconds(seconds) {
        if (seconds == 0 || seconds == 1)
            return this.seconds + " second";

        var secs = seconds % 60;
        var mins = window.parseInt(seconds / 60);

        var pluralS = function (i) {
            return i > 1 ? "s" : "";
        };

        var msg = "";

        if (mins > 0)
            msg += mins + " minute" + pluralS(mins);

        if (mins > 0 && secs > 0)
            msg += ", ";

        if (secs > 0)
            msg += secs + " second" + pluralS(secs);

        return msg;
    }

    var SocialBinder = (function () {
        function SocialBinder() {
        }
        SocialBinder.bindFacebook = function () {
            if (SocialBinder.facebookBound || typeof window.FB == "undefined")
                return;
            Log('Facebook bound');

            SocialBinder.facebookBound = true;

            window.FB.Event.subscribe('edge.create', function (href, widget) {
                Storage.likes.make();
                Subscriptions.invokeLikes();
                Ops().sendSocialEvent("Facebook", "Like", href);
            });

            window.FB.Event.subscribe('edge.remove', function (href, widget) {
                Storage.likes.unmake();
                Subscriptions.invokeUnlikes();
                Ops().sendSocialEvent("Facebook", "Unlike", href);
            });

            window.FB.Event.subscribe('comment.create', function (href, commentId) {
                Ops().sendSocialEvent("Facebook", "Add comment", href);
            });

            window.FB.Event.subscribe('comment.remove', function (href, commentId) {
                Ops().sendSocialEvent("Facebook", "Remove comment", href);
            });

            window.FB.Event.subscribe('message.send', function (href) {
                Storage.fbSentMsgs.make();
                Subscriptions.invokeFbSendMsg();
                Ops().sendSocialEvent("Facebook", "Send message", href);
            });
        };

        SocialBinder.bindTwitter = function () {
            if (SocialBinder.twitterBound || typeof window.twttr == "undefined")
                return;

            Log('Twitter bound');

            SocialBinder.twitterBound = true;

            window.twttr.events.bind('tweet', function (e) {
                Storage.tweets.make();
                Subscriptions.invokeTweets();
                Ops().sendSocialEvent("Twitter", "Tweet", "Tweet");
            });
            window.twttr.events.bind('follow', function (e) {
                Storage.follows.make();
                Subscriptions.invokeFollows();
                Ops().sendSocialEvent("Twitter", "Follow", "@" + e.data.screen_name);
            });
        };
        SocialBinder.facebookBound = false;
        SocialBinder.twitterBound = false;
        return SocialBinder;
    })();

    var StorageElement = (function () {
        function StorageElement(storageKey) {
            this.key = storageKey;
        }
        StorageElement.prototype.make = function () {
            StorageElement.additionLocal(this.key, 1);
            StorageElement.additionSession(this.key, 1);
        };

        StorageElement.prototype.unmake = function () {
            StorageElement.additionLocal(this.key, -1);
            StorageElement.additionSession(this.key, -1);
        };

        StorageElement.prototype.getLocalCount = function () {
            return StorageElement.getLocalInt(this.key);
        };

        StorageElement.prototype.getSessionCount = function () {
            return StorageElement.getSessionInt(this.key);
        };

        StorageElement.getLocalInt = function (elem) {
            if (window.localStorage.getItem('gai_' + elem) === null)
                window.localStorage.setItem('gai_' + elem, '0');

            return window.parseInt(window.localStorage.getItem('gai_' + elem));
        };

        StorageElement.additionLocal = function (elem, add) {
            var likes = StorageElement.getLocalInt(elem);
            StorageElement.setLocalInt(elem, likes + add);
        };

        StorageElement.setLocalInt = function (elem, value) {
            window.localStorage.setItem('gai_' + elem, value);
        };

        StorageElement.getSessionInt = function (elem) {
            if (window.sessionStorage.getItem('gai_' + elem) === null)
                window.sessionStorage.setItem('gai_' + elem, '0');

            return window.parseInt(window.sessionStorage.getItem('gai_' + elem));
        };

        StorageElement.setSessionInt = function (elem, value) {
            window.sessionStorage.setItem('gai_' + elem, value);
        };

        StorageElement.additionSession = function (elem, add) {
            var likes = StorageElement.getSessionInt(elem);
            StorageElement.setSessionInt(elem, likes + add);
        };
        return StorageElement;
    })();
    GAI.StorageElement = StorageElement;

    var Storage = (function () {
        function Storage() {
        }
        Storage.likes = new StorageElement('likes');
        Storage.fbSentMsgs = new StorageElement('fbSentMsgs');
        Storage.tweets = new StorageElement('tweets');
        Storage.follows = new StorageElement('follows');
        Storage.linkedInShares = new StorageElement('linkedInShares');
        return Storage;
    })();
    GAI.Storage = Storage;

    var ScrollTracker = (function () {
        function ScrollTracker() {
            this.trackValues = [];
        }
        ScrollTracker.prototype.addTrack = function (value, label, offset) {
            if (typeof offset === "undefined") { offset = 0; }
            if (/(\.|#)[a-zA-Z0-9_\-]+/.test(value) == false && /[0-9]+%/.test(value) == false) {
                window.console.log('The value you want to track is not understood: ' + value);
                return;
            }

            this.trackValues.push({
                value: value,
                label: label || value,
                offset: offset
            });
        };

        ScrollTracker.prototype.getOffset = function (elemId) {
            var elem = this.trackValues[elemId];

            if (elem.value.indexOf('%') > 0) {
                return GAI.$(window.document).height() * window.parseInt(elem.value) / 100 - elem.offset;
            }

            var jElem = GAI.$(elem.value);

            if (jElem.length > 0)
                return jElem.offset().top - elem.offset;
else
                return null;
        };

        //Send Analytics event, also remove the elem from scroll track list
        ScrollTracker.prototype.sendEvent = function (elemId) {
            var elem = this.trackValues[elemId];

            this.trackValues.splice(elemId, 1);

            Ops().sendEvent('GAI', 'Scroll', elem.label);
        };

        ScrollTracker.prototype.tick = function () {
            var windowPos = GAI.$(window).scrollTop() + GAI.$(window).height();

            for (var i = 0; i < this.trackValues.length; i++) {
                var offsetTop = this.getOffset(i);

                if (windowPos >= offsetTop)
                    this.sendEvent(i);
            }
        };
        return ScrollTracker;
    })();

    var YoutubeTracker = (function () {
        function YoutubeTracker() {
            this.iframeApiLoaded = false;
            this.players = [];
            this.processedIframes = [];
        }
        YoutubeTracker.prototype.getYoutubeIframes = function () {
            var iframes = [];

            var tags = window.document.getElementsByTagName('iframe');

            for (var i = 0; i < tags.length; i++) {
                var e = tags[i];

                try  {
                    var src = (e).src;

                    if (/^https?:\/\/www\.youtube.com\/embed\//.test(src)) {
                        iframes.push(e);
                    }
                } catch (e) {
                    window.console.log("Can't get iframe url");
                }
            }

            return iframes;
        };

        YoutubeTracker.prototype.tick = function () {
            var _this = this;
            var ytIframes = this.getYoutubeIframes();

            if (ytIframes.length == 0)
                return;

            this.includeYoutubeApiJs();

            if (typeof window.YT != 'undefined') {
                GAI.$('iframe').each(function (i, e) {
                    try  {
                        var src = (e).src;
                    } catch (e) {
                        window.console.log("Can't get iframe src");
                        return;
                    }

                    if (/^https?:\/\/www\.youtube.com\/embed\//.test(src)) {
                        _this.generatePlayerObject(e);
                    }
                });
            }
        };

        YoutubeTracker.prototype.youtubeStateChange = function (e) {
            var url = e.target.getVideoUrl();
            var duration = e.target.getDuration();
            var currentTime = e.target.getCurrentTime();

            var watchedPercent = window.parseInt((100 * currentTime) / duration);

            if (e.data == 0) {
                Ops().sendEvent("GAI", "Video Finished", url);
            } else if (e.data == 2 && watchedPercent < 100) {
                Ops().sendEvent("GAI", "Video Stop", url, watchedPercent);
            } else if (e.data == 3 && watchedPercent < 100) {
                Ops().sendEvent("GAI", "Video Start", url);
            }
        };

        YoutubeTracker.youtubeStateValue = function (data) {
            if (data == 0)
                return "End";

            switch (data) {
                case 0:
                    return 'End';
                case 1:
                    return 'Continue';
                case 2:
                    return 'Stop';
                case 3:
                    return 'Start';
            }
            ;

            return null;
        };

        YoutubeTracker.prototype.generatePlayerObject = function (elem) {
            if (this.players.indexOf(elem) >= 0)
                return;

            if (this.processedIframes.indexOf(elem) >= 0)
                return;

            this.processedIframes.push(elem);

            try  {
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
            } catch (e) {
            }
        };

        YoutubeTracker.prototype.includeYoutubeApiJs = function () {
            if (this.iframeApiLoaded == true || typeof window.YT != 'undefined')
                return;

            Log('Including YouTube Iframe API');

            this.iframeApiLoaded = true;
            GAI.$.getScript("//www.youtube.com/iframe_api");
        };
        return YoutubeTracker;
    })();

    var SubscriptionCollection = (function () {
        function SubscriptionCollection() {
            this.funcs = [];
        }
        SubscriptionCollection.prototype.add = function (func) {
            this.funcs.push(func);
        };

        SubscriptionCollection.prototype.invoke = function () {
            for (var i = 0; i < this.funcs.length; i++) {
                this.funcs[i]();
            }
        };
        return SubscriptionCollection;
    })();

    var Subscriptions = (function () {
        function Subscriptions() {
        }
        Subscriptions.subscribeLikes = function (func) {
            Subscriptions.Likes.add(func);
        };

        Subscriptions.invokeLikes = function () {
            Subscriptions.Likes.invoke();
        };

        Subscriptions.subscribeUnlikes = function (func) {
            Subscriptions.Unlikes.add(func);
        };

        Subscriptions.invokeUnlikes = function () {
            Subscriptions.Unlikes.invoke();
        };

        Subscriptions.subscribeTweets = function (func) {
            Subscriptions.Tweets.add(func);
        };

        Subscriptions.invokeTweets = function () {
            Subscriptions.Tweets.invoke();
        };

        Subscriptions.subscribeFollows = function (func) {
            Subscriptions.Follows.add(func);
        };

        Subscriptions.invokeFollows = function () {
            Subscriptions.Follows.invoke();
        };

        Subscriptions.subscribeLinkedInShares = function (func) {
            Subscriptions.LinkedinShares.add(func);
        };

        Subscriptions.invokeLinkedInShares = function () {
            Subscriptions.LinkedinShares.invoke();
        };

        Subscriptions.subscribeFbSendMsg = function (func) {
            Subscriptions.FbSendMsg.add(func);
        };

        Subscriptions.invokeFbSendMsg = function () {
            Subscriptions.FbSendMsg.invoke();
        };
        Subscriptions.Likes = new SubscriptionCollection();
        Subscriptions.Unlikes = new SubscriptionCollection();
        Subscriptions.Tweets = new SubscriptionCollection();
        Subscriptions.Follows = new SubscriptionCollection();
        Subscriptions.LinkedinShares = new SubscriptionCollection();
        Subscriptions.FbSendMsg = new SubscriptionCollection();
        return Subscriptions;
    })();
    GAI.Subscriptions = Subscriptions;

    // The manager class
    var Manager = (function () {
        function Manager(config) {
            var _this = this;
            this.scrollTracker = new ScrollTracker();
            this.instantiateTime = new window.Date();
            this.YoutubeTracker = new YoutubeTracker();
            this.tickCounter = 0;
            GAI.$ = window.jQuery;

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
                durationEventCategory: config.durationEventCategory || "GAI",
                durationEventAction: config.durationEventAction || "Duration"
            };

            if (this.config.externalLinkTracking == true)
                this.trackExternalLinks();

            GAI.$.each(this.config.scrollEvents, function (i, v) {
                if (typeof v == "string")
                    _this.scrollEvent(v);
else
                    _this.scrollEvent(v.value, v.label, v.offset);
            });

            GAI.$.each(this.config.durationEvents, function (i, v) {
                return _this.durationEvent(v);
            });

            if (typeof this.config.callback == "function")
                this.config.callback();

            this.tick();

            if (window.location.hostname == 'localhost' || GetCookie('gaiDebug') == '1')
                GAI.Debug = true;
        }
        Manager.prototype.scrollEvent = function (elem, label, offset) {
            if (typeof offset === "undefined") { offset = 0; }
            this.scrollTracker.addTrack(elem, label, offset);
        };

        Manager.prototype.durationEvent = function (seconds) {
            var _this = this;
            window.setTimeout(function () {
                Ops().sendEvent(_this.config.durationEventCategory, _this.config.durationEventAction, ReadableSeconds(seconds));
            }, seconds * 1000);
        };

        Manager.prototype.smartScrollEvents = function () {
            var w = GAI.$(window).height();
            var d = GAI.$(window.document).height();

            if (d > w * 3)
                return ['50%', '90%'];
            if (d > w * 2)
                return ['80%'];
            if (d > w * 1.2)
                return ['95%'];

            return [];
        };

        Manager.prototype.trackExternalLinks = function () {
            var _this = this;
            //Link click event (mouse down actually)
            var linkClickEvent = function (elem) {
                elem.one('mousedown', function () {
                    var href = elem.attr('href');
                    href = href.replace(/^http[s]?:\/\//, '');

                    var host = href.split('/')[0];

                    if (host == window.host)
                        return;

                    var eventCategory = elem.attr('data-gai-event-category') || _this.config.externalLinkEventCategory;
                    var eventAction = elem.attr('data-gai-event-action') || _this.config.externalLinkEventAction;
                    var eventLabel = elem.attr('data-gai-event-label') || href;

                    var socialAnalyzer = new SocialAnalyzer(elem);

                    if (socialAnalyzer.isSocial) {
                        Ops().sendSocialEvent(socialAnalyzer.network, socialAnalyzer.action, socialAnalyzer.target);
                    } else {
                        Ops().sendEvent(eventCategory, eventAction, eventLabel);
                    }

                    if (elem.attr('target') != '_blank' || href.indexOf('mailto:') == 0) {
                        elem.click(function (e) {
                            e.preventDefault();
                        });
                        window.setTimeout('document.location = "' + href + '"', _this.config.externalLinkTimeout);
                    }
                });
            };

            GAI.$('a[target="_blank"], a[href^="mailto:"]').each(function () {
                var href = GAI.$(this).attr('href');

                if (typeof href == "undefined" || href == "" || href == "#" || /^javascript:/.test(href))
                    return;

                if (/^https?:\/\//.test(this.href) || this.href.indexOf('mailto:') == 0) {
                    linkClickEvent(GAI.$(this));
                }
            });
        };

        Manager.prototype.tick = function () {
            var _this = this;
            window.setInterval(function () {
                _this.tickCounter++;

                if (_this.config.facebookTracking && !SocialBinder.facebookBound)
                    SocialBinder.bindFacebook();
                if (_this.config.twitterTracking && !SocialBinder.twitterBound)
                    SocialBinder.bindTwitter();

                _this.scrollTracker.tick();

                if (new Date().getTime() - _this.instantiateTime.getTime() > 1000 && _this.tickCounter % 8 == 0) {
                    _this.YoutubeTracker.tick();
                }
            }, 500);
        };
        return Manager;
    })();
    GAI.Manager = Manager;
})(GAI || (GAI = {}));

window.gaiManager = new GAI.Manager(window._gaicnf || {});
