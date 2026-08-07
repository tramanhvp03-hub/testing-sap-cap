/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["zsaleorder/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
