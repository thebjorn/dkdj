import page from "./dk-page";

export function init_test(document, html)  {
    document.body.innerHTML = html;
    page.initialize(document);
}
