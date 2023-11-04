import { createElement, type ReactNode } from 'react';
import Stack from './Stack';
import isNode from './isNode';
import {
    isGeneratedNodeLike,
    type Elements,
    type NodeLike,
    GeneratedNodeLike,
} from './types';
import { getElementProps } from './defaults';

/**
 * Convert a react-like element to a react node.
 * @param element A react-like element, or an actual react node.
 * @returns A react node.
 */
export const convertToReact = <T extends Elements>(
    element: NodeLike<T> | ReactNode,
) => {
    if (isNode(element)) {
        return element;
    }
    const elementsStack: Stack<
        NodeLike & {
            jsxChildren: ReactNode[];
            childIndex: number;
        }
    > = new Stack({ ...element, jsxChildren: [], childIndex: 0 });

    while (!elementsStack.isEmpty()) {
        const el = elementsStack.pop();

        if (isGeneratedNodeLike(el)) {
            if (el.childIndex < el.children.length) {
                elementsStack.push(el);
                elementsStack.push({
                    ...el.children[el.childIndex],
                    jsxChildren: [],
                    childIndex: 0,
                });
                el.childIndex += 1;
            } else {
                if (elementsStack.isEmpty()) {
                    // This is the last element. return the generated react element
                    return createElement(
                        el.nodeElement,
                        getElementProps(el.nodeType, el.data, el.children),
                        ...el.jsxChildren,
                    );
                }
                elementsStack
                    .peek()
                    .jsxChildren.push(
                        createElement(
                            el.nodeElement,
                            getElementProps(el.nodeType, el.data, el.children),
                            ...el.jsxChildren,
                        ),
                    );
            }
        } else {
            if (elementsStack.isEmpty()) {
                return el.nodeElement;
            }
            elementsStack.peek().jsxChildren.push(el.nodeElement);
        }
    }

    return null;
};

/**
 * Get all of the text from inside a node, using its children.
 *
 * @example
 * the HTML looks like:
 * ```html
 * <h1>Hello, <b>world</b>!</h1>
 * ```
 * the text looks like:
 * ```js
 * "Hello, world!"
 * ```
 */
export const getTextInNode = (
    element: GeneratedNodeLike['children'],
): string => {
    const elementsStack = new Stack(...element);
    let text = '';

    while (!elementsStack.isEmpty()) {
        const el = elementsStack.pop();

        if (isGeneratedNodeLike(el)) {
            elementsStack.push(...el.children);
        } else if (typeof el.nodeElement === 'string') {
            text += el.nodeElement;
        }
    }

    return text;
};
