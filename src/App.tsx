import initMd from '../lib/md';

function App() {
    const md = initMd();

    return md`
  # jsx-in-md

  This package allows you to use react elements (and jsx in general) in you markdown.
  
  ## Usage Example
  
  To use the package, import the default export:
  \`\`\`ts
  import initMd from 'jsx-in-md';
  \`\`\`
  
  Then, you can use the function in a component to pass configuration settings, and get
  back an \`md\` function:
  
  \`\`\`tsx
  const ExampleComponent = () => {
      const md = initMd(
        // Configuration goes here, more details after.
      );
  };
  \`\`\`
  
  You can then use \`md\` as a tagged template, and pass in the markdown. Whenever you want to use jsx,
  just wrap it inside a placeholder (\`\${}\`)!
  
  \`\`\`tsx
  // inside ExampleComponent
  return md\`
  # This will be rendered as a <h1>!
  
  ## Inside this heading I will include a ${(
      <button type="button">Button!</button>
  )}
  \`
  \`\`\`
  
  ## Passing different component:
  By default, the package uses the following mapping to map markdown elements to jsx ones:
  | Element Key    | Markdown Element | JSX Element      |
  | :---------:    | :--------------: | :---------:      |
  | \`h1\`-\`h6\`      | Heading 1 - 6    | \`<h1>\` - \`<h6>\`  |
  | \`paragraph\`    | Paragraph        | \`<p>\`            |
  | \`strong\`       | Strong           | \`<strong>\`       |
  | \`emphasis\`     | Emphasis         | \`<em>\`           |
  | \`delete\`       | Delete           | \`<s>\`            |
  | \`link\`         | Link             | \`<a>\`            |
  | \`listItem\`     | List Item        | \`<li>\`           |
  | \`ol\`           | Ordered List     | \`<ol>\`           |
  | \`ul\`           | Unordered List   | \`<ul>\`           |
  | \`img\`          | Image            | \`<img>\`          |
  | \`thematicBreak\`| Thematic Break   | \`<hr>\`           |
  | \`code\`         | Code (Block)     | \`<pre><code>\     |
  | \`inlineCode\`   | Code (inline)    | \`<code>\`           |
  | \`break\`        | Line Break       | \`<br>\`           |
  | \`blockquote\`   | Block Quote      | \`<blockquote>\`   |
  
  Additionally, each heading block in wrapped with two elements: a section and a subsection. The generated HTML looks something like this:
  \`\`\`html
  <sectionElement id="heading-text">
      <Heading1>Heading Text</Heading1>
      <subsectionElement>
        <!-- Everything under this heading -->
      </subsectionElement>
  </sectionElement>
  \`\`\`
  This is useful to link to headings and have the page line up well. The section and subsection elements can also be changed, and their defaults are:
  | Element Key           | Element            | JSX Element |
  | :---------:           | :--------------:   | :---------: |
  | \`sectionContainer\`    | Section Element    | \`<div>\`     |
  | \`subsectionContainer\` | Subsection Element | \`<div>\`     |
  
  You can pass any component you want into the \`initMd\` function to change them. For example:
  \`\`\`tsx
  const GreenH1 = ({ children }: PropsWithChildren) => {
      // Will render its children in an h1 with green text
  
      return (
        <h1 style={{ color: 'green' }}>{children}</h1>
      );
  };
  
  // In ExampleComponent
  const md = initMd({
      h1: GreenH1,
      sectionContainer: 'section',
  });
  \`\`\`
  
  ## Caveats
  - Make sure your markdown isn't too indented: It has to be on the same level as the begining of the statment (see examples in this file).
  - If you want to use the string \`{{}}\`, make sure to escape it using a placeholder (\`\${${'{{}}'}}\`).
  - If you want to use the string \`\${}\`\, you can escape it using a backslash (\`\\\${}\`). This is just normal javascript templates.

  # Examples
  You can view how this readme page is rendered using \`jsx-in-md\` by running \`npm run dev\` (the code for it is in [src/App.tsx](./src/App.tsx))

  # Unsupported markdown
  Currently, the following markdown is not supported
  - Tables
  - Task list items (will be disaplyed as regular items)
  - Autolinks
  - Footnotes
  - HTML
  - Frontmatter
  `;
}

export default App;
