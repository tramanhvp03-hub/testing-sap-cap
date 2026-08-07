/*global QUnit*/

sap.ui.define([
	"zsaleorder/controller/Saleoder.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Saleoder Controller");

	QUnit.test("I should test the Saleoder controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
