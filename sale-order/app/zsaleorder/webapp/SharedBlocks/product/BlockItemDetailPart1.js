sap.ui.define([
    "sap/uxap/BlockBase"
], function (BlockBase) {
    "use strict";

    return BlockBase.extend("zsaleorder.SharedBlocks.product.BlockItemDetailPart1", {
        metadata: {
            views: {
                Collapsed: {
                    viewName: "zsaleorder.SharedBlocks.product.BlockItemDetailPart1",
                    type: "XML"
                },
                Expanded: {
                    viewName: "zsaleorder.SharedBlocks.product.BlockItemDetailPart1",
                    type: "XML"
                }
            }
        },

        formatCreatedAt: function (sDate) {
            if (!sDate) return "";
            var oDate = (sDate instanceof Date) ? sDate : new Date(sDate);
            if (isNaN(oDate.getTime())) return sDate;

            var dd = ("0" + oDate.getDate()).slice(-2);
            var mm = ("0" + (oDate.getMonth() + 1)).slice(-2);
            var yyyy = oDate.getFullYear();
            var h = oDate.getHours();
            var ampm = h >= 12 ? "PM" : "AM";
            h = h % 12 || 12;
            var hh = ("0" + h).slice(-2);
            var min = ("0" + oDate.getMinutes()).slice(-2);

            return dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min + " " + ampm;
        }
    });
});