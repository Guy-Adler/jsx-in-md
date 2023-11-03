import React, { createElement, type ReactNode, type ReactElement } from 'react';
import type { Root, RootContent } from 'mdast';
import { gfm } from 'micromark-extension-gfm';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import slugify from 'slugify';
import Stack from './Stack';
import isNode from './isNode';
import {
  isHeading,
  isParetNode,
  isPureLeaf,
  type AlmostFullReactNode,  
  type HeadingLevels,
  type NodeLike,
  ElementsMapping,
} from './types';
import { defaultElements, getElementProps } from './defaults';
import { convertToReact } from './conversionHelpers';

const JSX_ESCAPE = '{{}}';

/**
 * Convert a markdown tree to a react-like node array.
 * This includes inserting JSX elements into the tree, as well as deciding on
 * which react element will represent each markdown element.
 * 
 * @param root The root of the markdown elements tree
 * @param jsx A list of all jsx nodes, sorted by the position htey are to be inserted to (first to be inserted is first in the list)/
 * @returns An array of all the elements, as they should appear on the page.
 */
const mdToReactLike = (elementsMapping: ElementsMapping, root: Root, jsx: ReactNode[]) => {
  /*
  Will keep track of all the markdown elements. starting with all the root ones.
  The jsxChildren is a list of all child *elements* which go under this (for example, )
  */
  const elementsStack = new Stack<(Root | RootContent) & {
    jsxChildren: NodeLike[];
    childIndex: number;
  }>({...root, jsxChildren: [], childIndex: 0 });

  while (!elementsStack.isEmpty()) {
    const node = elementsStack.pop();

    if (isPureLeaf(node)) {
      // Element is the final node in the `children` chain.

      if (node.type === 'code' || node.type === 'inlineCode') {
        // Assumes `code` and `inlineCode` will never have JSX (it's not a bug, it's a feature)
        elementsStack.peek().jsxChildren.push({
          nodeType: node.type,
          nodeElement: elementsMapping[node.type],
          children: [{
            nodeElement: node.value,
          }],
          data: {
            ...Object.fromEntries(Object.entries(node).filter(([k]) => !['children', 'childIndex', 'type', 'position'].includes(k))),
          }
        });
      } else if (node.type === 'break' || node.type === 'thematicBreak') {
        elementsStack.peek().jsxChildren.push({
          nodeType: node.type,
          nodeElement: elementsMapping[node.type],
          children: [],
          data: {
            ...Object.fromEntries(Object.entries(node).filter(([k]) => !['children', 'childIndex', 'type', 'position'].includes(k))),
          },
        });
      } else if (node.type === 'text') {
        const text = node.value.split(JSX_ESCAPE);
        const finalText: ReactNode[] = [];
        if (text.length === 1) {
          finalText.push(text[0]);
        } else {
          // Alternatingly insert text and jsx.
          while (jsx.length > 0 && text.length > 0) {
            finalText.push(text.shift());
            if (text.length > 0) {
              // Don't insert jsx after the last text (if jsx is at the end, there will be an empty string after it).
              finalText.push(jsx.shift());
            }
          }
  
          // Add any remaining text if jsx ran out before text did.
          if (text.length > 0) {
            finalText.push(...text);
          }
        }
        elementsStack.peek().jsxChildren.push(...finalText.map((item) => ({
          nodeElement: item
        })));
      }
    } else {
      if (node.childIndex < node.children.length) {
        // There are still children for this node. Continue expanding them.
        elementsStack.push(node);
        elementsStack.push({ ...node.children[node.childIndex], childIndex: 0, jsxChildren: [] });
        node.childIndex++;
      } else {
        // No more children for the node. Ready to be added to the parent

        if (node.type === 'root') {
          // Exit condition: once all root's children were parsed, we are done.
          return node.jsxChildren;
        } else if (
          node.type === 'blockquote' ||
          node.type === 'delete' ||
          node.type === 'emphasis' ||
          node.type === 'link' ||
          node.type === 'listItem' ||
          node.type === 'paragraph' ||
          node.type === 'strong'
        ) {
          // regular elements with children; just add it to the parent.
          elementsStack.peek().jsxChildren.push({
            nodeType: node.type,
            nodeElement: elementsMapping[node.type],
            children: node.jsxChildren,
            data: {
              ...Object.fromEntries(Object.entries(node).filter(([k]) => !['children', 'childIndex', 'type', 'position'].includes(k))),
            },
          });
        } else if (node.type === 'heading') {
          // get the correct heading type from the node and add it to the parent
          elementsStack.peek().jsxChildren.push({
            nodeType: `h${node.depth}`,
            nodeElement: elementsMapping[`h${node.depth}`],
            children: node.jsxChildren,
            data: {
              ...Object.fromEntries(Object.entries(node).filter(([k]) => !['children', 'childIndex', 'type', 'position'].includes(k))),
            },
          });
        } else if (node.type === 'list') {
          // get the correct list type from the node and add it to the parent.
          elementsStack.peek().jsxChildren.push({
            nodeType: node.ordered ? 'ol' : 'ul',
            nodeElement: elementsMapping[node.ordered ? 'ol' : 'ul'],
            children: node.jsxChildren,
            data: {
              ...Object.fromEntries(Object.entries(node).filter(([k]) => !['children', 'childIndex', 'type', 'position'].includes(k))),
            },
          });
        }
      }
    }
  }

  return [];
};

/**
 * Collapse all of the content under a header to a single node
 * @param levelsStack The stack of levels to return to
 * @param headingLevelsContent The object containing the lists of elements in each level.
 */
const collapseHeaders = (elementsMapping: ElementsMapping, levelsStack: Stack<HeadingLevels | 0>, headingLevelsContent: Record<HeadingLevels | 0, AlmostFullReactNode[]>) => {
  // Get the level of the current lowest heading
  const currentHeadingLevel = levelsStack.pop();
  // Get the level of the next lowest heading
  const nextHeadingLevel = levelsStack.isEmpty() ? 0 : levelsStack.peek();
  // Get the next lowest heading element
  const sectionHeading = headingLevelsContent[nextHeadingLevel].pop()!;

  // Create the subcontainer:
  const subsectionContainer = createElement(
    elementsMapping.subsectionContainer,
    getElementProps('subsectionContainer', {}, []), // TODO these are not valid children :(
    ...(headingLevelsContent[currentHeadingLevel].map(convertToReact))
  );

  //                      v: This is here for technicallity (will always be a heading).
  const headingTitle = isNode(sectionHeading) ? sectionHeading.toString() : sectionHeading.children[0]?.nodeElement?.toString() ?? '';

  headingLevelsContent[nextHeadingLevel].push(
    createElement(
      elementsMapping.sectionContainer,
      {
        ...getElementProps('sectionContainer', {}, []), // TODO these are not valid children :(
        id: slugify(headingTitle, {
          lower: true,
          remove: /[*+~.()'"!:@]/g
        })
      },
      // v: This is here for technicallity (will always be a heading).
      isNode(sectionHeading)
        ? sectionHeading
        : createElement(
          sectionHeading.nodeElement,
          getElementProps(sectionHeading.nodeType, sectionHeading.data, sectionHeading.children), // TODO these are not valid children :(
          ...sectionHeading.children.map(convertToReact)
        ),
      subsectionContainer
    )
  );
  headingLevelsContent[currentHeadingLevel] = []
}

/**
 * Convert an array of react-like elements sorted from top to bottom into a list of react nodes.
 * @param elements An array containing react-like elements
 * @returns A list of react nodes, ready to be rendered.
 */
const sectionizeTree = (elementsMapping: ElementsMapping, elements: NodeLike[]) => {
  let currentHeadingLevel: HeadingLevels | 0 = 0;
  const levelsStack = new Stack<HeadingLevels | 0>();
  const headingLevelsContent: Record<HeadingLevels | 0, AlmostFullReactNode[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  while (elements.length > 0) {
    const element = elements.shift();

    if (isParetNode(element!)) {
      if (isHeading(element)) {
        const headingLevel = Number.parseInt(element.nodeType[1]) as HeadingLevels;
        if (headingLevel <= currentHeadingLevel) {
          // We got a heading with a higher (or same) level.
          
          // We need to collapse the current heading content to the new heading's level.
          while (!levelsStack.isEmpty() && levelsStack.peek() >= headingLevel) {
            collapseHeaders(elementsMapping, levelsStack, headingLevelsContent);
          }
          
          // Set the current heading level to the previous heading level.
          currentHeadingLevel = levelsStack.isEmpty() ? 0 : levelsStack.peek();
        }
        
        // Add the new heading to the content of the previous heading
        headingLevelsContent[currentHeadingLevel].push(element);
        // Update the current heading level to the new heading level
        currentHeadingLevel = headingLevel;
        // Add the current heading level to the stack of heading levels.
        levelsStack.push(currentHeadingLevel);
      } else {
        // A standard non-heading element which isn't JSX. just add it normally.
        headingLevelsContent[currentHeadingLevel].push(
          convertToReact(element),
        );
      }
    } else {
      // A JSX element.
      headingLevelsContent[currentHeadingLevel].push(element!.nodeElement);
    } 
  }

  // Collapse all of the tree down to the 0th level (which is the one above h1).
  while (!levelsStack.isEmpty() && levelsStack.peek() !== 0) {
    collapseHeaders(elementsMapping, levelsStack, headingLevelsContent);
  }

  // Return the tree (the level above h1). The conversion is redundant (it's already all react nodes) but whatever.
  return headingLevelsContent[0].map(convertToReact);
}

/**
 * A tagged template converting markdown (with optional jsx inside) into a valid react tree.
 * 
 * @param elements An object containing the mapping from node types to react components.
 * 
 * To use custom elements, you can pass them to this function.
 * 
 * To use the character sequence `{{}}` inside the element, you will have to escape it.
 * Doing ${'{{}}'} will work.
 * 
 * 
 * @example
 * ```ts
 * const ValueRenderer = ({ value }: { value: any }) => value;
 * 
 * const MyComponent = () => {
 *     cosnt md = initializeMd(); // could insert custom elements here.
 * 
 *     return md`
 *     # This is my first heading
 *
 *     ## This is my second heading
 * 
 *     ## This is another heading with a jsx ${<ValueRenderer value="value" />}!
 *  `
 * }
 * ```
 */
const initMd = (customElements: Partial<ElementsMapping> = {}) => {
  const elementsMapping = {
    ...defaultElements,
    ...customElements
  };

  /**
   * A tagged template converting markdown (with optional jsx inside) into a valid react tree.
   * 
   * To use the character sequence `{{}}` inside the element, you will have to escape it.
   * Doing ${'{{}}'} will work.
   * 
   * @example
   * ```ts
   * const ValueRenderer = ({ value }: { value: any }) => value;
   * 
   * const MyComponent = () => {
   *     return md`
   *     # This is my first heading
   *
   *     ## This is my second heading
   * 
   *     ## This is another heading with a jsx ${<ValueRenderer value="value" />}!
   *  `
   * }
   * ```
   */
  const md = (strings: TemplateStringsArray, ...jsx: ReactNode[]): ReactElement => {
    const emptyMd = strings.join(JSX_ESCAPE);

    const tree = fromMarkdown(emptyMd, {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()]
    });

    // By creating the element here we are preventing an array from being returned
    // and react complaining not each element has a key.
    return createElement(
      React.Fragment,
      {},
      ...sectionizeTree(elementsMapping, mdToReactLike(elementsMapping, tree, [...jsx]))
    );
  };

  return md;
}

export default initMd;
