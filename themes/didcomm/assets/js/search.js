(function () {
  'use strict';

  var searchIndex = null;

  function loadSearchIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    return fetch('/search-index.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        searchIndex = data;
        return data;
      });
  }

  function search(query, index) {
    var terms = query.toLowerCase().split(/\s+/).filter(function (t) {
      return t.length > 1;
    });
    if (terms.length === 0) return [];

    return index
      .map(function (item) {
        var score = 0;
        var titleLower = (item.title || '').toLowerCase();
        var summaryLower = (item.summary || '').toLowerCase();
        var contentLower = (item.content || '').toLowerCase();
        var tagsLower = (item.tags || []).join(' ').toLowerCase();

        terms.forEach(function (term) {
          if (titleLower.indexOf(term) !== -1) score += 10;
          if (summaryLower.indexOf(term) !== -1) score += 5;
          if (tagsLower.indexOf(term) !== -1) score += 3;
          if (contentLower.indexOf(term) !== -1) score += 1;
        });

        return { item: item, score: score };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (r) { return r.item; });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function createDropdown(input) {
    var existing = input.parentNode.querySelector('.search-dropdown');
    if (existing) return existing;

    var dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    dropdown.style.display = 'none';
    dropdown.setAttribute('role', 'listbox');
    input.parentNode.appendChild(dropdown);
    return dropdown;
  }

  function renderDropdownResults(dropdown, results, maxItems) {
    maxItems = maxItems || 8;
    if (results.length === 0) {
      dropdown.innerHTML = '<div class="search-no-results">No protocols found</div>';
      dropdown.style.display = '';
      return;
    }

    var html = '';
    var shown = results.slice(0, maxItems);
    for (var i = 0; i < shown.length; i++) {
      var item = shown[i];
      var statusClass = 'status-' + (item.status || '').toLowerCase();
      html +=
        '<div class="search-result-item" role="option" data-index="' + i + '">' +
          '<a hx-get="' + escapeHtml(item.htmxUrl) + '" ' +
            'hx-push-url="' + escapeHtml(item.url) + '" ' +
            'hx-trigger="click" hx-target="#content" hx-swap="innerHTML" ' +
            'href="' + escapeHtml(item.url) + '">' +
            escapeHtml(item.title) +
          '</a>' +
          '<div class="result-meta">' +
            '<span class="result-status ' + statusClass + '">' + escapeHtml(item.status || '') + '</span>' +
            '<span>@' + escapeHtml(item.publisher || '') + '</span>' +
          '</div>' +
          (item.summary ?
            '<div class="result-summary">' + escapeHtml(item.summary) + '</div>' : '') +
        '</div>';
    }

    if (results.length > maxItems) {
      html += '<div class="search-result-item" style="text-align:center; font-size:13px; color:#666">' +
        '<a hx-get="/protocols/partial.htmx" hx-push-url="/protocols/" ' +
          'hx-trigger="click" hx-target="#content" hx-swap="innerHTML" ' +
          'href="/protocols/">View all ' + results.length + ' results</a>' +
        '</div>';
    }

    dropdown.innerHTML = html;
    dropdown.style.display = '';

    // Process HTMX attributes on new elements
    if (typeof htmx !== 'undefined') htmx.process(dropdown);
  }

  function initSearch() {
    // Reveal search inputs (hidden by default for no-JS)
    var searchContainers = document.querySelectorAll('.js-search');
    for (var i = 0; i < searchContainers.length; i++) {
      searchContainers[i].style.display = '';
    }

    // Enhance all search inputs
    var inputs = document.querySelectorAll('.site-search');
    for (var i = 0; i < inputs.length; i++) {
      enhanceSearchInput(inputs[i]);
    }
  }

  function enhanceSearchInput(input) {
    // Avoid double-initialization
    if (input.dataset.searchEnhanced) return;
    input.dataset.searchEnhanced = 'true';

    var debounceTimer;
    var dropdown = createDropdown(input);
    var activeIndex = -1;

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var query = input.value.trim();

      if (query.length < 2) {
        dropdown.style.display = 'none';
        activeIndex = -1;
        return;
      }

      debounceTimer = setTimeout(function () {
        loadSearchIndex().then(function (index) {
          var results = search(query, index);
          renderDropdownResults(dropdown, results);
          activeIndex = -1;
        });
      }, 200);
    });

    // Keyboard navigation
    input.addEventListener('keydown', function (e) {
      var items = dropdown.querySelectorAll('.search-result-item');
      if (items.length === 0 || dropdown.style.display === 'none') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        updateActiveItem(items, activeIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActiveItem(items, activeIndex);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        var link = items[activeIndex].querySelector('a');
        if (link) link.click();
        dropdown.style.display = 'none';
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        activeIndex = -1;
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
        activeIndex = -1;
      }
    });

    // Prevent form submission (search is handled client-side)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && activeIndex < 0) {
        e.preventDefault();
      }
    });
  }

  function updateActiveItem(items, index) {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === index);
    }
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }

  // Re-initialize after HTMX swaps
  document.body.addEventListener('htmx:afterSwap', function (event) {
    if (event.target.id === 'content') {
      initSearch();
    }
  });
})();
