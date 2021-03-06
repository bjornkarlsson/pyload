define(['jquery', 'backbone', 'underscore', 'app', 'utils/apitypes', 'models/Package', 'hbs!tpl/dashboard/actionbar'],
    /*jslint -W040: false*/
    function($, Backbone, _, App, Api, Package, template) {
        'use strict';

        // Modified version of type ahead show, nearly the same without absolute positioning
        function show() {
            this.$menu
                .insertAfter(this.$element)
                .show();

            this.shown = true;
            return this;
        }

        // Renders the actionbar for the dashboard, handles everything related to filtering displayed files
        return Backbone.Marionette.ItemView.extend({

            events: {
                'click .filter-type': 'filter_type',
                'click .filter-state': 'switch_filter',
                'submit .form-search': 'search'
            },

            ui: {
                'search': '.search-query',
                'stateMenu': '.dropdown-toggle .state'
            },

            template: template,
            state: null,

            initialize: function() {
                this.state = Api.DownloadState.All;

                // Apply the filter before the content is shown
                App.vent.on('dashboard:contentReady', _.bind(this.apply_filter, this));
            },

            onRender: function() {
                                // use our modified method
                $.fn.typeahead.Constructor.prototype.show = show;
                this.ui.search.typeahead({
                    minLength: 2,
                    source: this.getSuggestions
                });

            },

            // TODO: app level api request
            search: function(e) {
                e.stopPropagation();
                var query = this.ui.search.val();
                this.ui.search.val('');

                var pack = new Package();
                // Overwrite fetch method to use a search
                // TODO: quite hackish, could be improved to filter packages
                //       or show performed search
                pack.fetch = function(options) {
                    pack.search(query, options);
                };

                App.dashboard.openPackage(pack);
            },

            getSuggestions: function(query, callback) {
                $.ajax(App.apiRequest('searchSuggestions', {pattern: query}, {
                    method: 'POST',
                    success: function(data) {
                        callback(data);
                    }
                }));
            },

            switch_filter: function(e) {
                e.stopPropagation();
                var element = $(e.target);
                var state = parseInt(element.data('state'), 10);
                var menu = this.ui.stateMenu.parent().parent();
                menu.removeClass('open');

                if (state === Api.DownloadState.Finished) {
                    menu.removeClass().addClass('dropdown finished');
                } else if (state === Api.DownloadState.Unfinished) {
                    menu.removeClass().addClass('dropdown active');
                } else if (state === Api.DownloadState.Failed) {
                    menu.removeClass().addClass('dropdown failed');
                } else {
                    menu.removeClass().addClass('dropdown');
                }

                this.state = state;
                this.ui.stateMenu.text(element.text());
                this.apply_filter();
            },

            // Applies the filtering to current open files
            apply_filter: function() {
                if (!App.dashboard.files)
                    return;

                var self = this;
                App.dashboard.files.map(function(file) {
                    var visible = file.get('visible');
                    if (visible !== self.is_visible(file)) {
                        file.set('visible', !visible, {silent: true});
                        file.trigger('change:visible', !visible);
                    }
                });

                App.vent.trigger('dashboard:filtered');
            },

            // determine if a file should be visible
            // TODO: non download files
            is_visible: function(file) {
                if (this.state === Api.DownloadState.Finished)
                    return file.isFinished();
                else if (this.state === Api.DownloadState.Unfinished)
                    return file.isUnfinished();
                else if (this.state === Api.DownloadState.Failed)
                    return file.isFailed();

                return true;
            },

            filter_type: function(e) {

            }

        });
    });