sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "zsaleorder/SharedBlocks/product/formatter"
], function(Controller, formatter) {
  "use strict";
  return Controller.extend("zsaleorder.SharedBlocks.product.BlockItemDetailPart1", {
    formatter: formatter
  });
});
