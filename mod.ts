import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
// https://reactgo.com/deno-check-file-exists/
import { existsSync } from "https://deno.land/std/fs/mod.ts";

const navBar = `<nav><a href="/" title="Homepage" accesskey="h">Home</a></nav>`

const pageTemplate = (title: String, content: String, isNotFound: Boolean = false) => 
  new Response(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link referrerpolicy="no-referrer">
    <meta name="referrer" content="no-referrer">
    <meta name="description" content="A Markdown blog on Deno.">
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body id="top">
    <div class="a11y-nav top">
      <a href="#content" accesskey="c">Skip to content</a>
    </div>
    <header>
      ${navBar}
      <h1>${title}</h1>
    </header>
    <main>
      <section id="content">
${content}
      </section>
    </main>
    <footer>
      ${navBar}
      <p>Unlicense | <a href="https://github.com/jasiqli/deno-markdown-journal" title="GitHub">GitHub</a></p>
    </footer>
    <div class="a11y-nav bot">
      <a href="#top" accesskey="t">Back to top</a>
    </div>
  </body>
</html>`, {
  status: isNotFound ? 404 : 200,
  headers: {
    'Content-Type': 'text/html; charset=utf-8'
  }
})

//
async function handleRequest(request: Request): Promise<Response> {
 
  const { pathname } = new URL(request.url);

  // Check if the request is for style.css.
  if (pathname === "/styles.css") {
    // Read the style.css file from the file system.
    const file = await Deno.readFile("./styles.css");
    // Respond to the request with the style.css file.
    return new Response(file, {
      headers: {
        "content-type": "text/css",
      },
    });
  }

  // Check if the request is for style.css.
  if (pathname === "/favicon.png") {
    // Read the style.css file from the file system.
    const file = await Deno.readFile("./favicon.png");
    // Respond to the request with the style.css file.
    return new Response(file, {
      headers: {
        "content-type": "image/png",
      },
    });
  }

  // Journal Entries
  const BOOK_ROUTE = new URLPattern({ pathname: "/post/:name" });
  const postMatch = BOOK_ROUTE.exec(request.url);

  if (postMatch) {

    const filename = `./post/${postMatch.pathname.groups.name}.md`

    if (existsSync(filename)) {
      const fileContent = await Deno.readFile(filename)
      const decoder = new TextDecoder("utf-8");
      const markdown = decoder.decode(fileContent);
      const markup = Marked.parse(markdown);
      return pageTemplate(markup.meta.title, markup.content, false)
    }
    
    return pageTemplate("404 Not Found", `<p>Post ${postMatch.pathname.groups.name} does not exist.</p>`)
    
  }

  // Homepage
  if (pathname === "/") {
    const journalList = await Deno.readFile('./journal.md')
    const decoder = new TextDecoder("utf-8");
    const markdown = decoder.decode(journalList);
    const markup = Marked.parse(markdown);
    return pageTemplate(
      markup.meta.title,
      `<dl>${markup.meta.posts.map(p => `<dt><a href="/post/${p.slug}">${p.title}</a></dt><dd>${p.excerpt}</dd>`)}</dl>`)
  }

  return pageTemplate('404 Not Found', `<p>Was it you or me?</p>`, true)
}

serve(handleRequest);
