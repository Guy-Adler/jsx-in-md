import { type PropsWithChildren } from 'react';
import type { GetElementProps, GeneratedNodeLikeData } from './types';

export const defaultElements = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',

    paragraph: 'p',
    strong: 'strong', // bold
    emphasis: 'em', // italics
    delete: 's', // strikethrough

    link: 'a',

    listItem: 'li',
    ol: 'ol',
    ul: 'ul',

    img: 'img',
    thematicBreak: 'hr',
    code: ({ children }: PropsWithChildren) => (
        <pre>
            <code>{children}</code>
        </pre>
    ),
    inlineCode: 'code',
    break: 'br',
    blockquote: 'blockquote',

    sectionContainer: 'div',
    subsectionContainer: 'div',
} as const;

export const getElementProps: GetElementProps = (element, data) => {
    if (element === 'link') {
        return {
            href: (data as GeneratedNodeLikeData<'link'>).url,
        };
    }
    return {};
};
