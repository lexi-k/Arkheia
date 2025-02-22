"use strict";
const angular = require("angular");

export function Modal($rootScope, $uibModal) {
  /**
   * Opens a modal
   * @param  {Object} scope      - an object to be merged with modal's scope
   * @param  {String} modalClass - (optional) class(es) to be applied to the modal
   * @return {Object}            - the instance $uibModal.open() returns
   */
  function openModal(scope = {}, modalClass = "modal-default") {
    var modalScope = $rootScope.$new();

    angular.extend(modalScope, scope);

    return $uibModal.open({
      template: require("./modal.html"),
      windowClass: modalClass,
      scope: modalScope,
    });
  }

  // Public API here
  return {
    /* Confirmation modals */
    confirm: {
      /**
       * Create a function to open a delete confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
       * @param  {Function} del - callback, ran when delete is confirmed
       * @return {Function}     - the function to open the modal (ex. myModalFn)
       */
      delete(del = angular.noop) {
        /**
         * Open a delete confirmation modal
         * @param  {String} name   - name or info to show on modal
         * @param  {All}           - any additional args are passed straight to del callback
         */
        return function (...args) {
          var slicedArgs = Reflect.apply(Array.prototype.slice, args);
          var name = slicedArgs.shift();
          var deleteModal;

          deleteModal = openModal(
            {
              modal: {
                dismissable: true,
                title: "Confirm Delete",
                html:
                  "<p>Are you sure you want to delete <strong>" +
                  name +
                  "</strong> ?</p>",
                buttons: [
                  {
                    classes: "btn-danger",
                    text: "Delete",
                    click: function (e) {
                      deleteModal.close(e);
                    },
                  },
                  {
                    classes: "btn-default",
                    text: "Cancel",
                    click: function (e) {
                      deleteModal.dismiss(e);
                    },
                  },
                ],
              },
            },
            "modal-danger"
          );

          deleteModal.result.then(function (event) {
            Reflect.apply(del, event, slicedArgs);
          });
        };
      },
    },
  };
}

export default angular.module("arkheiaApp.Modal", []).factory("Modal", Modal)
  .name;
