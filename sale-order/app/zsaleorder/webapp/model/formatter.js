sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    var oCreatedAtFormat = DateFormat.getDateTimeInstance({
        pattern: "dd/MM/yyyy HH:mm:ss"
    });

    return {
        formatCreatedAt: function (vValue) {
            if (!vValue) {
                return "";
            }

            var oDate = (vValue instanceof Date) ? vValue : new Date(vValue);
            return isNaN(oDate.getTime()) ? vValue : oCreatedAtFormat.format(oDate);
        }
    };
});