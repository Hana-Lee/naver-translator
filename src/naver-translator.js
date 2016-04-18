/**
 * @author Hana Lee
 * @since 2016-04-18 17:07
 */
/*jslint
 browser  : true,
 continue : true,
 devel    : true,
 indent   : 2,
 maxerr   : 50,
 nomen    : true,
 plusplus : true,
 regexp   : true,
 vars     : true,
 white    : true,
 todo     : true,
 node     : true
 */
var https = require('https');
var qs = require('querystring');

/**
 * @class
 * @param {Object} credentials Credentials
 * @param {String} credentials.client_id Client ID
 * @param {String} credentials.client_secret Client Secret
 * @constructor
 */
function NaverTranslator(credentials) {
  'use strict';
  this.credentials = credentials;
  this.options = {
    host : 'openapi.naver.com',
    path : '/v1/language/{0}',
    port : 443,
    method : 'POST',
    headers : {
      'Content-Type' : 'application/x-www-form-urlencoded', 'Accept' : '*/*',
      'X-Naver-Client-Id' : this.credentials.client_id,
      'X-Naver-Client-Secret' : this.credentials.client_secret
    }
  };

  this.SUPPORT_LANGUAGES = {
    KO : 'ko', EN : 'en', JA : 'ja', ZH_CN : 'zh-CN',
    stringToType : function (string) {
      var result = null;
      Object.keys(this).forEach(function (key) {
        if (this[key] === string) {
          result = key;
        }
      }, this);

      return result;
    }
  };

  this.SUPPORT_TRANSLATE_PATTERN = [
    {source : this.SUPPORT_LANGUAGES.KO, target : this.SUPPORT_LANGUAGES.EN},
    {source : this.SUPPORT_LANGUAGES.KO, target : this.SUPPORT_LANGUAGES.JA},
    {source : this.SUPPORT_LANGUAGES.KO, target : this.SUPPORT_LANGUAGES.ZH_CN},
    {source : this.SUPPORT_LANGUAGES.EN, target : this.SUPPORT_LANGUAGES.KO},
    {source : this.SUPPORT_LANGUAGES.JA, target : this.SUPPORT_LANGUAGES.KO},
    {source : this.SUPPORT_LANGUAGES.ZH_CN, target : this.SUPPORT_LANGUAGES.KO}
  ];
}

/**
 *
 * @returns {Array|*[]}
 */
NaverTranslator.prototype.getSupportTranslatePatterns = function () {
  'use strict';

  return this.SUPPORT_TRANSLATE_PATTERN;
};

/**
 *
 * @returns {{KO: string, EN: string, JA: string, ZH_CN: string}|*}
 */
NaverTranslator.prototype.getSupportLanguages = function () {
  'use strict';

  return this.SUPPORT_LANGUAGES;
};

NaverTranslator.prototype.call = function (path, params, fn) {
  'use strict';

  this.options.path = this.options.path.replace('{0}', path);

  var translateRequest = https.request(this.options, function (/** @type {ServerResponse} res */res) {
    console.log('status:', res.statusCode);

    // res.setEncoding('utf8');

    var body = {};

    res.on('data', function (result) {
      body = JSON.parse(result);
    });
    res.on('end', function () {
      /**
       * @prop {Object} body
       * @prop {Object} body.message
       * @prop {String} body.message.@type
       * @prop {String} body.message.@service
       * @prop {String} body.message.@version
       * @prop {Object} body.message.result
       * @prop {String} body.message.result.translatedText
       *
       * @prop {String} body.errorMessage Error Message - Optional
       * @prop {String} body.errorCode Error Code
       */
      if (body.errorMessage) {
        console.log('server error', JSON.stringify(body));
        fn(new Error(body), body);
      } else if (body.message) {
        var resultText = body.message.result.translatedText;
        console.log('Translate success', JSON.stringify(body));
        fn(resultText);
      } else {
        fn(body);
      }
    });
    res.on('error', function (err) {
      console.log('translate response error', err);
      fn(err);
    });
  });

  translateRequest.on('error', function (err) {
    console.log('translate request error', err);
    fn(err);
  });

  translateRequest.write(qs.stringify(params));
  translateRequest.end();
};

NaverTranslator.prototype.makeRequest = function (path, params, fn, method) {
  'use strict';

  method = method || 'call';
  this[method](path, params, fn);
};

NaverTranslator.prototype._validationParams = function (params) {
  'use strict';

  if (!params || !params.text || !params.target) {
    console.log('params error', params);
    return {error : new Error('params error')};
  }

  var error;
  if (!this.SUPPORT_LANGUAGES.stringToType(params.source)) {
    error = new Error('Not support language : ' + params.target);
  }

  if (!error && !this.SUPPORT_LANGUAGES.stringToType(params.target)) {
    error = new Error('Not support language : ' + params.target);
  }

  if (error) {
    console.log('Not support language : ' + params.target, params);
    return {error : error};
  }

  return {error : null};
};
/**
 * Converts a text string from one language to another.
 * 파라메터를 받아 번역을 시도 합니다
 * @example
 * <pre><code>
 * var nt = new NaverTranslator();
 * var params = {
 *   text : '한국어',
 *   source : 'ko',
 *   target : 'en'
 * };
 * tn.translate(params, function (result) { console.log(result); });
 * </code></pre>
 * @param {Object} params Parameters
 * @param {String} params.text The text to translate. 번역을 할 텍스트
 * @param {String} [params.source] Language code of the translation text. - [default ko] 번역 대상 텍스트의 언어 코드
 * @param {String} params.target Language code to translate the text into. 번역이 될 언어 코드
 * @param {Function} fn callback function
 */
NaverTranslator.prototype.translate = function (params, fn) {
  'use strict';

  var validationResult = this._validationParams(params);

  if (validationResult.error) {
    console.log('params error', params);
    fn(validationResult.error, params);
  } else {
    if (!params.source) {
      console.log('Set default source : ko');
      params.source = 'ko';
    }

    this.makeRequest('translate', params, fn);
  }
};

module.exports = NaverTranslator;