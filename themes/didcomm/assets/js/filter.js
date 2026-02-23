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

  function renderCard(item) {
    var el = document.createElement('div');
    el.className = 'w3-card w3-margin protocol-summary-card';
    el.setAttribute('data-status', (item.status || '').toLowerCase());
    el.setAttribute('data-publisher', (item.publisher || '').toLowerCase());
    el.setAttribute('data-license', (item.license || '').toLowerCase());
    el.setAttribute('data-tags', (item.tags || []).join(',').toLowerCase());
    el.setAttribute('data-authors', (item.authors || []).join(',').toLowerCase());

    var statusClass = 'status-' + (item.status || '').toLowerCase();
    el.innerHTML =
      '<div class="title">' +
        '<a hx-get="' + item.htmxUrl + '" hx-push-url="' + item.url + '" ' +
          'hx-trigger="click" hx-target="#content" hx-swap="innerHTML" ' +
          'href="' + item.url + '" class="w3-xlarge">' +
          escapeHtml(item.title) +
        '</a> <span class="w3-small">' + escapeHtml(item.version || '') + '</span>' +
        '<div class="flex-spacer"></div>' +
        '<div class="status ' + statusClass + '">' + escapeHtml(item.status || '') + '</div>' +
      '</div>' +
      '<p>' + escapeHtml(item.summary || '') + '</p>' +
      '<div class="committer-info w3-medium">' +
        '<a rel="noreferrer noopener nofollow" href="https://github.com/' + encodeURIComponent(item.publisher || '') + '">' +
          '<img class="avatar" src="https://github.com/' + encodeURIComponent(item.publisher || '') + '.png" alt="' + escapeHtml(item.publisher || '') + '"/>' +
          ' @' + escapeHtml(item.publisher || '') +
        '</a>' +
        '<p>' + escapeHtml(item.license || '') + '</p>' +
      '</div>';
    return el;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initFilters() {
    var sidebar = document.getElementById('filter-sidebar');
    if (!sidebar) return;

    // Show JS checkboxes, hide no-JS links
    var jsOnlyEls = sidebar.querySelectorAll('.js-only');
    var nojsOnlyEls = sidebar.querySelectorAll('.nojs-only');
    for (var i = 0; i < jsOnlyEls.length; i++) {
      jsOnlyEls[i].style.display = '';
    }
    for (var i = 0; i < nojsOnlyEls.length; i++) {
      nojsOnlyEls[i].style.display = 'none';
    }

    var cardsContainer = document.getElementById('protocol-cards');
    var pagination = document.querySelector('.pagination');
    var checkboxes = sidebar.querySelectorAll('input[type="checkbox"]');
    var originalHTML = cardsContainer ? cardsContainer.innerHTML : '';
    var filtersActive = false;

    function getActiveFilters() {
      var filters = {};
      for (var i = 0; i < checkboxes.length; i++) {
        var cb = checkboxes[i];
        if (cb.checked) {
          var group = cb.name;
          if (!filters[group]) filters[group] = [];
          filters[group].push(cb.value);
        }
      }
      return filters;
    }

    function hasActiveFilters(filters) {
      for (var key in filters) {
        if (filters.hasOwnProperty(key) && filters[key].length > 0) return true;
      }
      return false;
    }

    function matchesFilters(item, filters) {
      for (var group in filters) {
        if (!filters.hasOwnProperty(group)) continue;
        var values = filters[group];
        if (values.length === 0) continue;

        var itemValue;
        if (group === 'tags') {
          itemValue = (item.tags || []).map(function (t) { return t.toLowerCase(); });
          // OR within group: at least one tag matches
          var tagMatch = values.some(function (v) {
            return itemValue.indexOf(v) !== -1;
          });
          if (!tagMatch) return false;
        } else if (group === 'authors') {
          itemValue = (item.authors || []).map(function (a) { return a.toLowerCase(); });
          var authorMatch = values.some(function (v) {
            return itemValue.some(function (a) { return a.indexOf(v) !== -1; });
          });
          if (!authorMatch) return false;
        } else {
          itemValue = (item[group] || '').toLowerCase();
          // OR within group
          var match = values.some(function (v) { return itemValue === v; });
          if (!match) return false;
        }
      }
      return true;
    }

    function applyFilters() {
      var filters = getActiveFilters();

      if (!hasActiveFilters(filters)) {
        // Restore original paginated view
        if (filtersActive && cardsContainer) {
          cardsContainer.innerHTML = originalHTML;
          if (typeof htmx !== 'undefined') htmx.process(cardsContainer);
        }
        if (pagination) pagination.style.display = '';
        filtersActive = false;
        removeResultCount();
        return;
      }

      // Fetch full index and filter
      loadSearchIndex().then(function (index) {
        var results = index.filter(function (item) {
          return matchesFilters(item, filters);
        });

        if (cardsContainer) {
          cardsContainer.innerHTML = '';
          results.forEach(function (item) {
            cardsContainer.appendChild(renderCard(item));
          });
          // Tell HTMX to process new elements
          if (typeof htmx !== 'undefined') htmx.process(cardsContainer);
        }

        if (pagination) pagination.style.display = 'none';
        filtersActive = true;
        showResultCount(results.length, index.length);
      });
    }

    function showResultCount(visible, total) {
      removeResultCount();
      var el = document.createElement('div');
      el.className = 'filter-result-count';
      el.id = 'filter-result-count';
      el.textContent = 'Showing ' + visible + ' of ' + total + ' protocols';
      if (cardsContainer) {
        cardsContainer.parentNode.insertBefore(el, cardsContainer);
      }
    }

    function removeResultCount() {
      var existing = document.getElementById('filter-result-count');
      if (existing) existing.remove();
    }

    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].addEventListener('change', applyFilters);
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFilters);
  } else {
    initFilters();
  }

  // Re-initialize after HTMX swaps
  document.body.addEventListener('htmx:afterSwap', function (event) {
    if (event.target.id === 'content') {
      initFilters();
    }
  });
})();
