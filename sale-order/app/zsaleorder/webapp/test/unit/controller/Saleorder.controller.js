/*global QUnit*/

sap.ui.define([
	"zsaleorder/controller/Saleorder.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Saleorder Controller");

	QUnit.test("I should test the Saleorder controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
