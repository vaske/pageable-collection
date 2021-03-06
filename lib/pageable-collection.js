/**
 * Backbone - Pageable Collection. Simple paginator on top of Collection.
 * version 0.3.5
 * Kane Cohen [KaneCohen@gmail.com] | https://github.com/KaneCohen
 * @preserve
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(_, Backbone);
  } else {
    root.returnExports = factory(_, Backbone);
  }
}(this, function(_, Backbone) {

  var presenterMixin = Backbone.PageableCollectionPresenterMixin = {
    collection: null,
    tagName: 'div',
    className: 'pager-container',
    container: null,
    events: function() {
      if (this.collection.ajaxLoad) {
        return {
          'click a': 'openPage',
          'change .page-selector': 'changePerPage'
        };
      }
    },
    initialize: function(collection) {
      this.collection = collection;
      return this;
    },
    render: function() {
      // If total is being set by the server, then we'll
      // stick with normal pager. If it's not set, then
      // we'll switch to slider mode.
      if (this.collection.state.total > 0) {
        this.pager();
      } else {
        this.slider();
      }
      return this;
    },
    links: this.render,
    pager: function() {
      var content = '';
      if (this.collection.state.lastPage > 1) {
        if (this.collection.state.lastPage < 13) {
          content = this.getPageRange(1, this.collection.state.lastPage);
        } else {
          content = this.getPagination();
        }
      }
      this.$el.html('<ul class="pager">' + this.getPrevLink() + content +
        this.getNextLink() + '</ul>'+ this.getPerPageSelector()
      );
      return this;
    },
    slider: function() {
      this.$el.html(this.getPrevLink() + this.getNextLink());
      return this;
    },
    infinite: function() {
      this.$el.html(this.getMoreLink());
      return this;
    },
    openPage: function(e) {
      var page = parseInt(e.currentTarget.getAttribute('data-page'), 10);
      this.collection.fetchPage(page, {reset: true});
      e.preventDefault();
      return false;
    },
    /*
    changePerPage: function(e) {
      var el = e.currentTarget;
      var perPage = el.options[el.selectedIndex].value;
      this.collection.setState({perPage: perPage});
      this.collection.fetchPage(this.collection.state.currentPage, {reset: true});
    },*/
    changePerPage: function(e) {
      var el = e.currentTarget;
      var perPage = el.options[el.selectedIndex].value;
      var paramName = this.collection.params.perPage || 'perPage';
      var newSearch = this.replaceUrlParam(window.location.search, paramName, perPage)
      window.location.search = newSearch;
    },
    replaceUrlParam: function(url, paramName, paramValue){
        if(paramValue == null)
            paramValue = '';
        var pattern = new RegExp('\\b('+paramName+'=).*?(&|$)')
        if(url.search(pattern)>=0){
            return url.replace(pattern,'$1' + paramValue + '$2');
        }
        return url + (url.indexOf('?')>-1 ? '&' : '?') + paramName + '=' + paramValue
    },
    getPrevLink: function() {
      if (this.collection.hasPrevPage()) {
        return '<li class="page-prev"><a href="'+this.collection.getPaginatorUrl(this.collection.state.currentPage - 1, true)+'" data-page="'+(this.collection.state.currentPage - 1)+'"><i class="icon icon-arrow-left"></i></a></li>';
      }
      return '';
    },
    getNextLink: function() {
      if (this.collection.hasNextPage()) {
        return '<li class="page-next"><a href="'+this.collection.getPaginatorUrl(this.collection.state.currentPage + 1, true)+'" data-page="'+(this.collection.state.currentPage + 1)+'"><i class="icon icon-arrow-right"></i></a></li>';
      }
      return '';
    },
    getMoreLink: function() {
      if (this.collection.hasNextPage()) {
        return '<li class="page-more"><a href="'+this.collection.getPaginatorUrl(this.collection.state.currentPage + 1, true)+'" data-page="'+(this.collection.state.currentPage + 1)+'">More</a></li>';
      }
      return '';
    },
    getPerPageSelector: function() {
      var c = this.collection;
      if (c.showPerPageSelector) {
        var pageSelector = '<select class="page-selector">',
          selectorValues = c.pageSelectorValues,
          activeValue = c.getParam(this.collection.params.perPage || 'perPage', this.collection.state.perPage),
          pages = [];

        for (var v in selectorValues) {
          if (activeValue == selectorValues[v]) {
            pages.push('<option value='+selectorValues[v]+' selected>'+selectorValues[v]+'</option>');
          } else {
            pages.push('<option value='+selectorValues[v]+'>'+selectorValues[v]+'</option>');
          }
        }

        pageSelector += pages.join('');
        pageSelector += '</select>';

        return pageSelector;
      }
      return '';
    },
    getPageRange: function(start, end) {
      var pages = [];

      for (var page = start; page <= end; page++) {
        if (this.collection.state.currentPage == page) {
          pages.push('<li class="active">'+this.getLink(page)+'</li>');
        }
        else {
          pages.push('<li>'+this.getLink(page)+'</li>');
        }
      }

      return pages.join('');
    },
    getPagination: function() {
      var w = 6, ending, start, content;
      if (this.collection.state.currentPage <= w) {
        ending = this.getFinish();
        return this.getPageRange(1, w + 2) + ending;
      } else if (this.collection.state.currentPage >= this.collection.state.lastPage - w) {
        start = this.collection.state.lastPage - 8;
        content = this.getPageRange(start, this.collection.state.lastPage);
        return this.getStart()+content;
      } else {
        content = this.getAdjacentRange();
        return this.getStart()+content+this.getFinish();
      }
    },
    getLink: function(page) {
      return '<a href="'+this.collection.getPaginatorUrl(page, true)+'" data-page="'+page+'">'+page+'</a>';
    },
    getAdjacentRange: function() {
      start = this.collection.state.currentPage - 3;

      return this.getPageRange(start, this.collection.state.currentPage + 3);
    },
    getStart: function() {
      return this.getPageRange(1, 2)+this.getDots();
    },
    getFinish: function() {
      var content = this.getPageRange(this.collection.state.lastPage - 1, this.collection.state.lastPage);
      return this.getDots()+content;
    },
    getDots: function() {
      return '<li class="disabled"><a href="#">...</a></li>';
    }
  };

  var presenter = Backbone.View.extend(presenterMixin);

  var PageableCollection = Backbone.PageableCollection = Backbone.Collection.extend({

    mode:        'server', // Modes: 'server', 'client'.
    style:       false,    // Force pagination style: 'pager', 'slider',  'infinite'.
                           // if not set, will be determinded either between pager or slider.
    headerState: false,    // If set to true, pager will use header data for state (if available).
    cache:       false,    // Keep loaded pages in cache. Used only for server/infinite mode.
    cachedPages: {},       // If cache is true, store cached pages in this object. Clear on sort/search.
    presenter:   null,
    linkUrl:     null,
    ajaxLoad:    true,     // Use collection fetch method to get data after clicking on a page.
    updateUrl:   true,     // Update url in address bar after ajax data fetch.
    state: {},
    // Defaults.
    defaultState: {
      currentPage: 1,
      firstPage:   1,
      lastPage:    0,
      perPage:     20,
      total:       0
    },

    appendParams: true,      // Append params to the currently existing params in url.
    params: {},
    // Defaults.
    defaultParams: {
      currentPage: 'page',   // Param name used to determine current page.
      offset:      false,    // Param name for offset to send on fetch.
      perPage:     false,    // Param telling server how many items should be per page.
      sortParam:   'sort',   // Param name containing details about sorting.
      sortBy:      false,    // Param telling which field to use for sorting.
      orderParam:  'order',  // Param name containing details about ordering.
      orderBy:     false     // Param indicating order for sorting (fasle/asc/desc).
    },

    showPerPageSelector: false, // Display per-page selection.
    pageSelectorValues : [10,20,30,60,120,180,240,300],

    constructor: function(models, options) {
      Backbone.Collection.apply(this, arguments);
      options || (options = {});
      if (options.url) this.url = options.url;
      if (options.model) this.model = options.model;
      if (typeof options.comparator !== 'undefined') this.comparator = options.comparator;
      this.state = _.extend({}, this.defaultState, this.state, options.state);
      this.params = _.extend({}, this.defaultParams, this.params, options.params);
      this.state.currentPage = this.getParam(this.params.currentPage, this.state.firstPage);
      this.mode = options.mode || this.mode;
      this.showPerPageSelector = options.showPerPageSelector || this.showPerPageSelector;
      this.pageSelectorValues = options.pageSelectorValues || this.pageSelectorValues;
      if (! this.params.perPage && this.showPerPageSelector) this.params.perPage = 'perPage';
      if (this.showPerPageSelector) {
        this.state.perPage = this.getParam(this.params.perPage, this.state.perPage);
      }

      this.updateState();
      if (! this.presenter) {
        this.setPresenter(presenter);
      }
    },

    setState: function(state) {
      this.state = _.extend({}, this.state, state);
      this.updateState();
    },

    // Extension of core reset method with updateState.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      this.updateState();
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Extension of core method. Deals with server data.
    parse: function(resp, options) {
      var items = resp;
      if (_.isObject(resp) && _.has(resp, 'state') && _.has(resp, 'items')) {
        _.extend(this.state, resp.state);
        items = resp.items;
      }
      // Use data from header to update state.
      if (this.headerState) {
        if (options.xhr.getResponseHeader('X-PerPage'))
          this.state.perPage = options.xhr.getResponseHeader('X-PerPage');
        if (options.xhr.getResponseHeader('X-CurrentPage'))
          this.state.currentPage = options.xhr.getResponseHeader('X-CurrentPage');
        if (options.xhr.getResponseHeader('X-Total'))
          this.state.total = options.xhr.getResponseHeader('X-Total');
      }
      return items;
    },

    // Sanity check for state.
    updateState: function() {
      // Make sure **total** param is ok.
      this.state.total = ! isNaN(this.state.total) ? parseInt(this.state.total, 10) : 0;
      // **perPage** has to be numeric and more than 0.
      this.state.perPage = ! isNaN(this.state.perPage) && this.state.perPage > 0 ? parseInt(this.state.perPage, 10) : 20;
      // **firstPage** has to be numeric and more than 0 and less or equal to current page.
      this.state.firstPage = ! isNaN(this.state.firstPage) && this.state.firstPage > 0 ? parseInt(this.state.firstPage, 10) : 1;
      // Recalculate last page based on **total** and **perPage** params.
      this.state.lastPage = this.state.total > 0 ? Math.ceil(this.state.total / this.state.perPage) : 0;
      // Validate **currentPage** param.
      this.state.currentPage = ! isNaN(this.state.currentPage) ? parseInt(this.state.currentPage, 10) : this.state.firstPage;
      // **lastPage** can't be more than current page. If it is, set currentPage to the clculated lastPage.
      if (this.state.total > 0 && ! isNaN(this.state.currentPage) && this.state.currentPage > this.state.lastPage) {
        this.state.currentPage = this.state.lastPage > 0 ? this.state.lastPage : 1;
      }
    },

    // Get current collection mode.
    getMode: function() {
      return this.mode;
    },

    // Set new mode.
    setMode: function(mode) {
      if (_.contains(['client', 'server'], mode)) {
        this.mode = mode;
        this.updateState();
      }
      return this;
    },

    // Get current page number.
    getCurrentPage: function() {
      return this.state.currentPage;
    },

    // Set current page number.
    setCurrentPage: function(page) {
      this.state.currentPage = page;
      this.updateState();
      return this;
    },

    // Get first page number if exists.
    getFirstPage: function() {
      return this.state.firstPage;
    },

    // Set first page number.
    setFirstPage: function(page) {
      this.state.firstPage = page;
      this.updateState();
      return this;
    },

    // Get last page number if exists.
    getLastPage: function() {
      return this.state.lastPage;
    },

    // Get next page number if exists, otherwise return null.
    getNextPage: function() {
      return this.hasNextPage() ? this.state.currentPage + 1 : null;
    },

    // Get previous page number if exists, otherwise return null.
    getPrevPage: function() {
      return this.hasPrevPage() ? this.state.currentPage - 1 : null;
    },

    // Get current per page items number.
    getPerPage: function() {
      return this.state.perPage;
    },

    // Set number of items per page.
    setPerPage: function(size) {
      this.state.perPage = size;
      this.updateState();
      return this;
    },

    // Set sorting param.
    setSort: function(param) {
      this.params.sortParam = param;
      this.updateState();
      return this;
    },

    // Set ordering param.
    setOrder: function(order) {
      this.params.sortOrder = order;
      this.updateState();
      return this;
    },

    // Set search param.
    setSearch: function() {
      this.params.sortOrder = order;
      this.updateState();
      return this;
    },

    // Calculate offset for a given page or for current page if no page given.
    getOffset: function(page) {
      page || (page = this.state.currentPage);
      var offset = (page - 1) * this.state.perPage;
      if (this.mode == 'server') {
        offset = 0;
      }
      return offset;
    },

    updateHistory: function(page) {
      var title = document.getElementsByTagName('title');
      var href = this.getPaginatorUrl(page, true);

      title = title ? title[0].innerText : '';
      history.pushState(null, title, href);
    },

    // Get models from the server, from the cache if set, or from items array in client mode.
    fetchPage: function(page, options) {
      options = options ? _.clone(options) : {};
      if (typeof options.parse === 'undefined') options.parse = true;
      options.url = this.getPaginatorUrl(page);
      var deferred = Backbone.$.Deferred();
      var method = options.reset ? 'reset' : 'set';
      this.state.currentPage = page;
      if (this.updateUrl && options.updateUrl !== false) {
        this.updateHistory(page);
      }
      if (this.mode == 'server') {
        if (this.cache && typeof this.cachedPages[page] !== 'undefined') {
          var models = collection.cachedPages[page];
          this[method](models, options);
          deferred.resolve(this.models);
        } else {
          return this.fetch(options);
        }
      } else if (this.mode == 'client') {
        this.trigger(method, this);
        deferred.resolve(this.models);
      }
      wrapError(this, options);
      return deferred.promise();
    },

    // Get next page number;
    fetchNextPage: function(options) {
      if (this.hasNextPage()) {
        return this.fetchPage(this.state.currentPage + 1, options);
      }
    },

    // Get previous page number.
    fetchPrevPage: function(options) {
      if (this.hasPrevPage()) {
        return this.fetchPage(this.state.currentPage - 1, options);
      }
    },

    // Get first page of items.
    fetchFirstPage: function(options) {
      if (this.state.currentPage !== this.state.firstPage) {
        return this.fetchPage(this.state.firstPage, options);
      }
    },

    // Get first page of items.
    fetchLastPage: function(options) {
      if (this.state.lastPage > 0 && this.state.currentPage != this.state.lastPage) {
        return this.fetchPage(this.state.lastPage, options);
      }
    },

    // Returns GET params object.
    queryParams: function() {
      var query = location.search.slice(1);
      if (! query.length) return {};

      query = query.split('&');
      var params = {};
      _.each(query, function(v) {
        var param = v.split('=');
        params[param[0]] = param[1];
      });
      return params;
    },

    // Get param from the query string by key. If not found, try using default.
    // If default not set, will return null.
    getParam: function(key, def) {
      var params = this.queryParams();
      if (typeof params[key] === 'undefined') {
        return def || null;
      } else {
        return params[key];
      }
    },

    // Clear cached pages.
    clearCache: function() {
      this.cachedPages = {};
      return this;
    },

    // Check if there's next page available.
    hasNextPage: function() {
      if (this.state.total === 0) {
        if (this.mode == 'server') {
          return this.state.perPage < this.length;
        } else if (this.mode == 'client') {
          return this.getOffset() + this.state.perPage < this.length;
        }
      } else {
        return this.state.currentPage < this.state.lastPage;
      }
    },

    // Check if there's previous page available.
    hasPrevPage: function() {
      return this.state.currentPage - 1 >= this.state.firstPage;
    },

    // Build url that will be used in pagination links.
    // Uses order, sort and other params as GET query parameters.
    getPaginatorUrl: function(page, link) {
      var root, params = {};
      params[this.params.currentPage] = page;
      if (this.params.offset) {
        params[this.params.offset] = this.getOffset(page);
      }
      if (this.params.perPage) {
        params[this.params.perPage] = this.state.perPage;
      }
      if (this.params.sortBy) params[this.params.sortParam] = this.params.sortBy;
      if (this.params.orderBy) params[this.params.orderParam] = this.params.orderBy;

      var queryString = '?';
      var queryParams = this.appendParams ? this.queryParams() : {};

      _.each(_.pairs(params), function(v, k) {
        queryParams[v[0]] = v[1];
      });

      queryString += _.map(_.pairs(queryParams), function(v, k) {
        return v.join('=');
      }).join('&');

      // If link is provided, append query string. Otherwise use collection url.
      if (link) {
        root = _.result(this, 'linkUrl') || _.result(this, 'url') || '';
      } else {
        root = _.result(this, 'url') || '';
      }
      root = root.split('?')[0];
      return root + queryString;
    },

    // Render links. Determined by current state or **view** param.
    links: function() {
      if (_.contains(['pager', 'links', 'infinite'], this.style)) {
        return this[this.style]();
      }
      return new this.presenter(this).render();
    },

    // Render pager-style links: <,1,5,6,7,20,>.
    pager: function() {
      return new this.presenter(this).pager();
    },

    // Render slider-style links: <,>.
    slider: function() {
      return new this.presenter(this).slider();
    },

    // Render with single button and event detection for autoload.
    infinite: function(container) {
      return new this.presenter(this).infinite(container);
    },

    // Set custom presenter view;
    setPresenter: function(presenter) {
      this.presenter = presenter;
      return this;
    },

    // Get current paginator presenter.
    getPresenter: function() {
      return this.presenter;
    }

  });

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return PageableCollection;

}));