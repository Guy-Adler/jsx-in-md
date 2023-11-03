import type { ReactNode, ElementType } from 'react';
import type { Root, RootContent, RootContentMap } from 'mdast';

export type Elements =
'h1' | 
'h2' | 
'h3' | 
'h4' | 
'h5' | 
'h6' | 
'paragraph' | 
'strong' | 
'emphasis' | 
'delete' | 
'link' | 
'listItem' | 
'ol' | 
'ul' | 
'img' | 
'thematicBreak' | 
'code' | 
'inlineCode' | 
'break' | 
'blockquote' | 
'sectionContainer' | 
'subsectionContainer'
;

export type ElementsMapping = Record<Elements, ElementType>;

export type HeadingLevels = 1 | 2 | 3 | 4 | 5 | 6;
export type Headings = `h${HeadingLevels}`;

type Parsed<T extends Elements = Elements> = 
  T extends Headings ? 'heading' :
  T extends 'ol' | 'ul' ? 'listItem' :
  T extends 'img' ? 'image' :
  T extends 'sectionContainer' | 'subsectionContainer' ? never :
  T;

export type GeneratedNodeLikeData<T extends Elements> =
  Omit<
    Parsed<T> extends never
      ? Record<string, never>
      : RootContentMap[Parsed<T>],
    'children' | 'data' | 'type' | 'position'
  >;

export type GeneratedNodeLike<T extends Elements = Elements> = {
  nodeType: T;
  nodeElement: ElementsMapping[T];
  children: NodeLike[];
  data: GeneratedNodeLikeData<T>;
};

type JsxNodeLike = {
  nodeElement: ReactNode;
};
export type NodeLike<T extends Elements = Elements> = GeneratedNodeLike<T> | JsxNodeLike;

export type AlmostFullReactNode = GeneratedNodeLike<Headings> | ReactNode;


export const isPureLeaf = <T extends Root | RootContent>(element: Root | RootContent): element is Exclude<T, { children: RootContent[] }> => (
  !Object.hasOwn(element, 'children')
);

export const isParetNode = (node: NodeLike): node is GeneratedNodeLike => (
  Object.hasOwn(node, 'nodeType')
);

export const isHeading = (node: Exclude<NodeLike, ReactNode>): node is GeneratedNodeLike<Headings> => (
  isParetNode(node) && (
    node.nodeType === 'h1' ||
    node.nodeType === 'h2' ||
    node.nodeType === 'h3' ||
    node.nodeType === 'h4' ||
    node.nodeType === 'h5' ||
    node.nodeType === 'h6'
  )
);

export const isGeneratedNodeLike = <T extends Elements, U extends NodeLike<T>>(element: U): element is Extract<U, GeneratedNodeLike<T>> => {
  return Object.hasOwn(element, 'nodeType')
};


type ElementProps<T> = T extends React.ComponentType<infer Props>
  ? Props extends object
    ? Props
    : never
  : T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : never;

export type GetElementProps<T extends ElementsMapping = ElementsMapping> = (
  element: Elements,
  data: GeneratedNodeLikeData<Elements>,
  children: NodeLike<Elements>[],
) => ElementProps<T[Elements]>;