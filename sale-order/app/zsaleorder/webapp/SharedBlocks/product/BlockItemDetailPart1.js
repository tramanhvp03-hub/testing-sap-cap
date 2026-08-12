sap.ui.define([
  "sap/uxap/BlockBase",
  "zsaleorder/SharedBlocks/product/formatter"
], function (BlockBase, formatter) {
  "use strict";

  var BlockItemDetailPart1 = BlockBase.extend("zsaleorder.SharedBlocks.product.BlockItemDetailPart1", {
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

    formatter: formatter
  });

  return BlockItemDetailPart1;
});
