sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"zsaleorderelement/test/integration/pages/OrdersList",
	"zsaleorderelement/test/integration/pages/OrdersObjectPage",
	"zsaleorderelement/test/integration/pages/OrderItemsObjectPage"
], function (JourneyRunner, OrdersList, OrdersObjectPage, OrderItemsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('zsaleorderelement') + '/test/flp.html#app-preview',
        pages: {
			onTheOrdersList: OrdersList,
			onTheOrdersObjectPage: OrdersObjectPage,
			onTheOrderItemsObjectPage: OrderItemsObjectPage
        },
        async: true
    });

    return runner;
});

