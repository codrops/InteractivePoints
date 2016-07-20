(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory;
  } else {
    root.lunar = factory();
  }
})(this, function () {

  'use strict';

  var lunar = {};

  lunar.hasClass = function (elem, name) {
    return new RegExp('(\\s|^)' + name + '(\\s|$)').test(elem.getAttribute('class'));
  };

  lunar.addClass = function (elem, name) {
    !lunar.hasClass(elem, name) && elem.setAttribute('class', (!!elem.getAttribute('class') ? elem.getAttribute('class') + ' ' : '') + name);
  };

  lunar.removeClass = function (elem, name) {
    var remove = elem.getAttribute('class').replace(new RegExp('(\\s|^)' + name + '(\\s|$)', 'g'), '$2');
    lunar.hasClass(elem, name) && elem.setAttribute('class', remove);
  };

  lunar.toggleClass = function (elem, name) {
    lunar[lunar.hasClass(elem, name) ? 'removeClass' : 'addClass'](elem, name);
  };

  return lunar;

});
