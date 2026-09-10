'use strict';

/**
 * Portfolio shell behaviour.
 *
 * Adapted from the vCard Personal Portfolio template (MIT, codewithsadee).
 * Changes from upstream are marked FIX / ADDED and are explained in
 * docs/code-review.md.
 */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const toggleActive = (elem) => elem.classList.toggle('active');


/* -------------------------------------------------------------------------
 * Sidebar (mobile "Show Contacts" disclosure)
 *
 * FIX: upstream called addEventListener on the result of querySelector with no
 * null check. Every block in this file is now guarded, because removing a
 * section from index.html should degrade one feature rather than throw and
 * kill every later listener on the page — including navigation.
 * ADDED: aria-expanded is kept in sync so the control is meaningful to a
 * screen reader, not just visually.
 * ---------------------------------------------------------------------- */
const sidebar = $('[data-sidebar]');
const sidebarBtn = $('[data-sidebar-btn]');

if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener('click', () => {
    const expanded = sidebar.classList.toggle('active');
    sidebarBtn.setAttribute('aria-expanded', String(expanded));
  });
}


/* -------------------------------------------------------------------------
 * Portfolio category filter
 *
 * Upstream's [data-selecct-value] typo is preserved deliberately: it is the
 * contract between this file and index.html, and renaming it in one place
 * only would silently break the select label. Noted in docs/code-review.md.
 * ---------------------------------------------------------------------- */
const select = $('[data-select]');
const selectItems = $$('[data-select-item]');
const selectValue = $('[data-selecct-value]');
const filterBtns = $$('[data-filter-btn]');
const filterItems = $$('[data-filter-item]');

const filterFunc = (selectedValue) => {
  filterItems.forEach((item) => {
    const match = selectedValue === 'all' || selectedValue === item.dataset.category;
    item.classList.toggle('active', match);
  });
};

if (select) {
  select.addEventListener('click', function () { toggleActive(this); });
}

selectItems.forEach((item) => {
  item.addEventListener('click', function () {
    const selectedValue = this.innerText.toLowerCase();
    if (selectValue) selectValue.innerText = this.innerText;
    if (select) toggleActive(select);
    filterFunc(selectedValue);
  });
});

let lastClickedBtn = filterBtns[0];

filterBtns.forEach((btn) => {
  btn.addEventListener('click', function () {
    const selectedValue = this.innerText.toLowerCase();
    if (selectValue) selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    if (lastClickedBtn) lastClickedBtn.classList.remove('active');
    this.classList.add('active');
    lastClickedBtn = this;
  });
});


/* -------------------------------------------------------------------------
 * Page navigation
 *
 * FIX: upstream matched pages with `this.innerHTML.toLowerCase()` and then set
 * the active nav link with `navigationLinks[i]` — where `i` was the *inner*
 * (page) loop counter. That only worked while the nav list and the page list
 * happened to be the same length and in the same order; adding a section
 * silently highlighted the wrong tab. Pages are now addressed by an explicit
 * data-nav-link value, and the active link is the one that was clicked.
 *
 * ADDED: aria-current="page" on the active control, and hash deep-linking so
 * a section can be shared as a URL (e.g. /#forge) and survives a reload.
 * ---------------------------------------------------------------------- */
const navigationLinks = $$('[data-nav-link]');
const pages = $$('[data-page]');

const pageNames = pages.map((page) => page.dataset.page);

const activatePage = (targetName, { updateHash = true, scroll = true } = {}) => {
  if (!pageNames.includes(targetName)) return false;

  pages.forEach((page) => {
    page.classList.toggle('active', page.dataset.page === targetName);
  });

  navigationLinks.forEach((link) => {
    const linkTarget = link.dataset.navLink || link.textContent.trim().toLowerCase();
    const isActive = linkTarget === targetName;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (updateHash) {
    // replaceState rather than assigning location.hash: assigning would make
    // the browser jump to any element sharing that id and add a history entry
    // for every tab click.
    history.replaceState(null, '', `#${targetName}`);
  }
  if (scroll) window.scrollTo(0, 0);

  return true;
};

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const target = link.dataset.navLink || link.textContent.trim().toLowerCase();
    activatePage(target);
  });
});

// In-page links such as <a href="#forge"> should switch tabs, not scroll.
document.addEventListener('click', (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) return;

  const target = anchor.getAttribute('href').slice(1);
  if (pageNames.includes(target)) {
    event.preventDefault();
    activatePage(target);
  }
});

// Restore the section named in the URL on first paint and on back/forward.
const openFromHash = ({ scroll } = { scroll: false }) => {
  const target = decodeURIComponent(window.location.hash.replace('#', '')).toLowerCase();
  if (target) activatePage(target, { updateHash: false, scroll });
};

openFromHash();
window.addEventListener('hashchange', () => openFromHash({ scroll: true }));
