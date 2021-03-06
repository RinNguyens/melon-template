"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ReCaptchaInstance_1 = require("./ReCaptchaInstance");
var ELoadingState;
(function (ELoadingState) {
    ELoadingState[ELoadingState["NOT_LOADED"] = 0] = "NOT_LOADED";
    ELoadingState[ELoadingState["LOADING"] = 1] = "LOADING";
    ELoadingState[ELoadingState["LOADED"] = 2] = "LOADED";
})(ELoadingState || (ELoadingState = {}));
var ReCaptchaLoader = (function () {
    function ReCaptchaLoader() {
    }
    ReCaptchaLoader.load = function (siteKey, options) {
        if (options === void 0) { options = {}; }
        if (typeof document === 'undefined') {
            return Promise.reject(new Error('This is a library for the browser!'));
        }
        if (ReCaptchaLoader.getLoadingState() === ELoadingState.LOADED) {
            if (ReCaptchaLoader.instance.getSiteKey() === siteKey) {
                return Promise.resolve(ReCaptchaLoader.instance);
            }
            else {
                return Promise.reject(new Error('reCAPTCHA already loaded with different site key!'));
            }
        }
        if (ReCaptchaLoader.getLoadingState() === ELoadingState.LOADING) {
            if (siteKey !== ReCaptchaLoader.instanceSiteKey) {
                return Promise.reject(new Error('reCAPTCHA already loaded with different site key!'));
            }
            return new Promise(function (resolve, reject) {
                ReCaptchaLoader.successfulLoadingConsumers.push(function (instance) { return resolve(instance); });
                ReCaptchaLoader.errorLoadingRunnable.push(function (reason) { return reject(reason); });
            });
        }
        ReCaptchaLoader.instanceSiteKey = siteKey;
        ReCaptchaLoader.setLoadingState(ELoadingState.LOADING);
        var loader = new ReCaptchaLoader();
        return new Promise(function (resolve, reject) {
            loader.loadScript(siteKey, options.useRecaptchaNet || false, options.renderParameters ? options.renderParameters : {}, options.customUrl).then(function () {
                ReCaptchaLoader.setLoadingState(ELoadingState.LOADED);
                var instance = new ReCaptchaInstance_1.ReCaptchaInstance(siteKey, grecaptcha);
                ReCaptchaLoader.successfulLoadingConsumers.forEach(function (v) { return v(instance); });
                ReCaptchaLoader.successfulLoadingConsumers = [];
                if (options.autoHideBadge) {
                    instance.hideBadge();
                }
                ReCaptchaLoader.instance = instance;
                resolve(instance);
            }).catch(function (error) {
                ReCaptchaLoader.errorLoadingRunnable.forEach(function (v) { return v(error); });
                ReCaptchaLoader.errorLoadingRunnable = [];
                reject(error);
            });
        });
    };
    ReCaptchaLoader.getInstance = function () {
        return ReCaptchaLoader.instance;
    };
    ReCaptchaLoader.setLoadingState = function (state) {
        ReCaptchaLoader.loadingState = state;
    };
    ReCaptchaLoader.getLoadingState = function () {
        if (ReCaptchaLoader.loadingState === null) {
            return ELoadingState.NOT_LOADED;
        }
        else {
            return ReCaptchaLoader.loadingState;
        }
    };
    ReCaptchaLoader.prototype.loadScript = function (siteKey, useRecaptchaNet, renderParameters, customUrl) {
        var _this = this;
        if (useRecaptchaNet === void 0) { useRecaptchaNet = false; }
        if (renderParameters === void 0) { renderParameters = {}; }
        if (customUrl === void 0) { customUrl = ''; }
        var scriptElement = document.createElement('script');
        scriptElement.setAttribute('recaptcha-v3-script', '');
        var scriptBase = 'https://www.google.com/recaptcha/api.js';
        if (useRecaptchaNet) {
            scriptBase = 'https://recaptcha.net/recaptcha/api.js';
        }
        if (customUrl) {
            scriptBase = customUrl;
        }
        var parametersQuery = this.buildQueryString(renderParameters);
        scriptElement.src = scriptBase + '?render=' + siteKey + parametersQuery;
        return new Promise(function (resolve, reject) {
            scriptElement.addEventListener('load', _this.waitForScriptToLoad(function () {
                resolve(scriptElement);
            }), false);
            scriptElement.onerror = function (error) {
                ReCaptchaLoader.setLoadingState(ELoadingState.NOT_LOADED);
                reject(new Error('Something went wrong while loading ReCaptcha. (' + error.toString() + ')'));
            };
            document.head.appendChild(scriptElement);
        });
    };
    ReCaptchaLoader.prototype.buildQueryString = function (parameters) {
        var parameterKeys = Object.keys(parameters);
        if (parameterKeys.length < 1) {
            return '';
        }
        return '&' + Object.keys(parameters).map(function (parameterKey) {
            return parameterKey + '=' + parameters[parameterKey];
        }).join('&');
    };
    ReCaptchaLoader.prototype.waitForScriptToLoad = function (callback) {
        var _this = this;
        return function () {
            if (window.grecaptcha === undefined) {
                setTimeout(function () {
                    _this.waitForScriptToLoad(callback);
                }, ReCaptchaLoader.SCRIPT_LOAD_DELAY);
            }
            else {
                window.grecaptcha.ready(function () {
                    callback();
                });
            }
        };
    };
    ReCaptchaLoader.loadingState = null;
    ReCaptchaLoader.instance = null;
    ReCaptchaLoader.instanceSiteKey = null;
    ReCaptchaLoader.successfulLoadingConsumers = [];
    ReCaptchaLoader.errorLoadingRunnable = [];
    ReCaptchaLoader.SCRIPT_LOAD_DELAY = 25;
    return ReCaptchaLoader;
}());
exports.load = ReCaptchaLoader.load;
exports.getInstance = ReCaptchaLoader.getInstance;
