  var Util = require('../utils.js');

  var SurveyView = require('mapseed-survey-view');
  var SupportView = require('mapseed-support-view');
  var RichTextEditorView = require('mapseed-rich-text-editor-view');

  var SubmissionCollection = require('../models/submission-collection.js');

  module.exports = Backbone.View.extend({
    events: {
      'click .place-story-bar .btn-previous-story-nav': 'onClickStoryPrevious',
      'click .place-story-bar .btn-next-story-nav': 'onClickStoryNext',
      'click #toggle-editor-btn': 'onToggleEditMode',
      'click #update-place-model-btn': 'onUpdateModel',
      'click #hide-place-model-btn': 'onHideModel',
      'click input[data-input-type="binary_toggle"]': 'onBinaryToggle',
      'change input[type="file"]': 'onInputFileChange',
      'change input, textarea': 'saveDraftChanges'
    },
    initialize: function() {
      var self = this;

      this.isEditable = Util.getAdminStatus(this.options.datasetId);
      this.isEditingToggled = false;
      this.surveyType = this.options.surveyConfig.submission_type;
      this.supportType = this.options.supportConfig.submission_type;
      this.isModified = false;
      this.categoryConfig = _.findWhere(this.options.placeConfig.place_detail, {category: this.model.get("location_type")});
      
      // use the current url as the key under which to store draft changes made
      // to this place detail view
      this.LOCALSTORAGE_KEY = Backbone.history.getFragment().replace("/", "-");

      this.model.on('change', this.onChange, this);

      // consider the editor modified if change or keyup events are registered
      // from the following selectors
      this.watchFields = "#update-place-model-form, #update-place-model-title-form";

      // Make sure the submission collections are set
      this.model.submissionSets[this.surveyType] = this.model.submissionSets[this.surveyType] ||
        new SubmissionCollection(null, {
          submissionType: this.surveyType,
          placeModel: this.model
        });

      this.model.submissionSets[this.supportType] = this.model.submissionSets[this.supportType] ||
        new SubmissionCollection(null, {
          submissionType: this.supportType,
          placeModel: this.model
        });

      this.surveyView = new SurveyView({
        collection: this.model.submissionSets[this.surveyType],
        surveyConfig: this.options.surveyConfig,
        userToken: this.options.userToken,
        datasetId: self.options.datasetId,
        placeDetailView: self
      });

      this.supportView = new SupportView({
        collection: this.model.submissionSets[this.supportType],
        supportConfig: this.options.supportConfig,
        userToken: this.options.userToken,
        datasetId: self.options.datasetId
      });

      // fetch comments here instead of in render(), to avoid fetching on
      // a re-render and possibly conflicting with in-progress update/delete calls
      this.model.submissionSets[this.surveyType].fetchAllPages();

      this.$el.on('click', '.share-link a', function(evt){

        // HACK! Each action should have its own view and bind its own events.
        var shareTo = this.getAttribute('data-shareto');

        Util.log('USER', 'place', shareTo, self.model.getLoggingDetails());
      });

      this.model.attachmentCollection.on("add", this.onAddAttachment, this);

      this.prepFields();
    },

    saveDraftChanges: function() {
      var attrs = this.scrapeForm();
      Util.localstorage.save(this.LOCALSTORAGE_KEY, attrs, 30) // save for 30 days
    },

    clearDraftChanges: function() {
      Util.localstorage.destroy(this.LOCALSTORAGE_KEY);
    },

    onClickStoryPrevious: function() {
      this.options.router.navigate(this.model.attributes.story.previous, {trigger: true});
    },

    onClickStoryNext: function() {
      this.options.router.navigate(this.model.attributes.story.next, {trigger: true});
    },

    onToggleEditMode: function() {
      if (this.isEditingToggled && this.isModified) {
        this.saveDraftChanges();
        //if(!confirm("You have unsaved changes. Proceed?")) return;
      }

      var toggled = !this.isEditingToggled;
      this.isEditingToggled = toggled;
      this.surveyView.options.isEditingToggled = toggled;
      this.prepFields();
      this.render();
    },
    prepFields: function() {
      var exclusions = ["submitter_name", "name", "location_type", "title"];
      this.fields = [];

      // Iterate through all the form fields for this place
      _.each(this.categoryConfig.fields, function(item, i) {
        
        // Handle input types on a case-by-case basis, building an appropriate
        // context object for each
        var userInput = this.model.get(item.name),
        content, 
        wasAnswered = false;

        if (item.type === "text" || 
            item.type === "textarea" || 
            item.type === "datetime" || 
            item.type === "richTextarea") {
          
          // Plain text
          content = userInput || "";
          if (content !== "") {
            wasAnswered = true;
          }
        } else if (item.type === "checkbox_big_buttons" || 
            item.type === "radio_big_buttons" || 
            item.type === "dropdown") {
          
          // Checkboxes, radio buttons, and dropdowns
          if (!_.isArray(userInput)) {

            // If input is not an array, convert to an array of length 1
            userInput = [userInput];
          }
          content = [];
          
          _.each(item.content, function(option) {
            var selected = false;
            if (_.contains(userInput, option.value)) {
              selected = true;
              wasAnswered = true;
            }
            content.push({
              value: option.value,
              label: option.label,
              selected: selected
            });
          });
        } else if (item.type === "binary_toggle") {
          
          // Binary toggle buttons
          // NOTE: We assume that the first option listed under content
          // corresponds to the "on" value of the toggle input
          content = {
            selectedValue: item.content[0].value,
            selectedLabel: item.content[0].label,
            unselectedValue: item.content[1].value,
            unselectedLabel: item.content[1].label,
            selected: (userInput == item.content[0].value) ? true : false
          }
          wasAnswered = true;
        }

        var newItem = {
          name: item.name,
          type: item.type,
          existingContent: content,
          prompt: item.display_prompt
        };

        if (_.contains(exclusions, item.name) === false &&
            item.name.indexOf('private-') !== 0 &&
            newItem.existingContent !== undefined && 
            wasAnswered === true &&
            item.form_only !== true) {
          
          this.fields.push(newItem);
        }

      }, this);
    },

    render: function() {
      var self = this,
          data = _.extend({
            place_config: this.options.placeConfig,
            survey_config: this.options.surveyConfig,
            url: this.options.url,
            isEditable: this.isEditable || false,
            isEditingToggled: this.isEditingToggled || false,
            isModified: this.isModified,
            fields: this.fields
          }, this.model.toJSON());

      data.submitter_name = this.model.get('submitter_name') ||
        this.options.placeConfig.anonymous_name;

      // Augment the template data with the attachments list
      data.attachments = this.model.attachmentCollection.toJSON();

      // Augment the data with any draft changes saved to localstorage
      if (this.isEditingToggled &&
          Util.localstorage.get(this.LOCALSTORAGE_KEY)) {
        
        this.isModified = true;
        data.isModified = true;
        _.extend(data, Util.localstorage.get(this.LOCALSTORAGE_KEY));
      }  

      this.$el.html(Handlebars.templates['place-detail'](data));

      // Render the view as-is (collection may have content already)
      this.$('.survey').html(this.surveyView.render().$el);

      this.$('.support').html(this.supportView.render().$el);
      // Fetch for submissions and automatically update the element
      this.model.submissionSets[this.supportType].fetchAllPages();

      this.delegateEvents();
      this.surveyView.delegateEvents();

      $("#content article").animate({ scrollTop: 0 }, "fast");
      
      // initialize datetime picker, if relevant
      $('#datetimepicker').datetimepicker({ formatTime: 'g:i a' });

      if (this.isEditingToggled) {
        $("#toggle-editor-btn").addClass("btn-depressed");
        $(".promotion, .place-submission-details, .survey-header, .reply-link, .response-header")
          .addClass("faded");

        // detect changes made to non-Quill form elements
        $(this.watchFields).on("keyup change", function(e) {
          if (e.type === "change") {
            self.onModified();
          } else if ((e.keyCode >= 48 && e.keyCode <= 57) || // 0-9 (also shift symbols)
              (e.keyCode >= 65 && e.keyCode <= 90) || // a-z (also capital letters)
              (e.keyCode === 8) || // backspace key
              (e.keyCode === 46) || // delete key
              (e.keyCode === 32) || // spacebar
              (e.keyCode >= 186 && e.keyCode <= 222)) { // punctuation
            
            self.onModified();
          }
        });

        $(".rich-text-field").each(function() {
          new RichTextEditorView({
            target: $(this).get(0),
            placeDetailView: self,
            fieldName: $(this).attr("name")
          });
        });
      }

      return this;
    },

    onModified: function() {
      this.isModified = true;
      $("#update-place-model-btn").addClass("isModified");
      $(this.watchFields).off("keyup change");
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    },

    onInputFileChange: function(evt) {
      var self = this,
          file,
          attachment;

      if(evt.target.files && evt.target.files.length) {
        file = evt.target.files[0];

        this.$('.fileinput-name').text(file.name);
        Util.fileToCanvas(file, function(canvas) {
          canvas.toBlob(function(blob) {
            //var fieldName = $(evt.target).attr('name'),
            var fieldName = Math.random().toString(36).substring(7),
                data = {
                  name: fieldName,
                  blob: blob,
                  file: canvas.toDataURL('image/jpeg')
                };

            attachment = self.model.attachmentCollection.find(function(model) {
              return model.get('name') === fieldName;
            });

            if (_.isUndefined(attachment)) {
              self.model.attachmentCollection.add(data);
            } else {
              attachment.set(data);
            }
          }, 'image/jpeg');
        }, {
          // TODO: make configurable
          maxWidth: 800,
          maxHeight: 800,
          canvas: true
        });
      }
    },

    // called by the router
    onCloseWithUnsavedChanges: function() {
      // if (confirm("You have unsaved changes. Proceed?")) {
      //   this.isModified = false;
      //   return true;
      // }

      // return false;
      
      return true;
    },

    onAddAttachment: function(attachment) {
      attachment.save();
      this.render();
    },

    onBinaryToggle: function(evt) {
      var self = this,
      category = this.model.get("location_type"),
      targetButton = $(evt.target).attr("id"),
      oldValue = $(evt.target).val(),
      // find the matching config data for this element
      selectedCategoryConfig = _.find(this.options.placeConfig.place_detail, function(categoryConfig) { return categoryConfig.category === category; }),
      altData = _.find(selectedCategoryConfig.fields, function(item) { return item.name === targetButton; }),
      // fetch alternate label and value
      altContent = _.find(altData.content, function(item) { return item.value != oldValue; });
      
      // set new value and label
      $(evt.target).val(altContent.value);
      $(evt.target).next("label").html(altContent.label);
    },

    scrapeForm: function() {
      var self = this,
      richTextAttrs = {};

      // attach data from Quill-enabled fields
      $(".ql-editor").each(function() {
        richTextAttrs[$(this).data("fieldName")] = $(this).html();
      });

      var attrs = _.extend(Util.getAttrs($("#update-place-model-form")), 
        Util.getAttrs($("#update-place-model-title-form")),
        richTextAttrs);

      // Special handling for binary toggle buttons: we need to remove
      // them completely from the model if they've been unselected in
      // the editor
      $("#update-place-model-form input[data-input-type='binary_toggle']").each(function(input) {
        if (!$(this).is(":checked")) {
          self.model.unset($(this).attr("id"));
        }
      });

      // Special handling for checkbox groups: if all items in a checkbox group
      // have been unselected, remove the group completely from the model
      $("#update-place-model-form .checkbox-group").each(function(group) {
        if ($(this).find("input:checkbox:checked").length === 0) {
          self.model.unset($(this).find(":first-child").attr("name"));
        }
      });
      
      return attrs;
    },

    onUpdateModel: function() {
      if (!this.isModified) {
        return;
      }

      var self = this,
      attrs = this.scrapeForm();

      this.model.save(attrs, {
        success: function() {
          self.clearDraftChanges();
          self.isModified = false;
          self.isEditingToggled = false;
          self.prepFields();
          self.render();
        },
        error: function() {
          // nothing
        }
      });
    },

    onHideModel: function() {
      var self = this;
      if (confirm("Are you sure you want to hide this post? It will no longer be visible on the map.")) { 
        this.model.save({"visible": false}, {
          success: function() {
            self.model.trigger("userHideModel", self.model);
          },
          error: function() {
            // nothing
          }
        });
      }
    }
  });
