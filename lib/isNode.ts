/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/*
Code taken directly from the prop-types package by facebook
https://github.com/facebook/prop-types/blob/main/factoryWithTypeCheckers.js#L474
*/
import { isValidElement, type ReactNode } from 'react';

/**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.
function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

export default function isNode(element: unknown): element is ReactNode {
  switch (typeof element) {
    case 'number':
    case 'string':
    case 'undefined':
      return true;
    case 'boolean':
      return !element;
    case 'object':
      if (Array.isArray(element)) {
        return element.every(isNode);
      }
      if (element === null || isValidElement(element)) {
        return true;
      }

      var iteratorFn = getIteratorFn(element);
      if (iteratorFn) {
        var iterator = iteratorFn.call(element);
        var step;
        if (iteratorFn !== element.entries) {
          while (!(step = iterator.next()).done) {
            if (!isNode(step.value)) {
              return false;
            }
          }
        } else {
          // Iterator will provide entry [k,v] tuples rather than values.
          while (!(step = iterator.next()).done) {
            var entry = step.value;
            if (entry) {
              if (!isNode(entry[1])) {
                return false;
              }
            }
          }
        }
      } else {
        return false;
      }

      return true;
    default:
      return false;
  }
}
