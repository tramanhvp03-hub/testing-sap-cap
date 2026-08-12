sap.ui.define(['sap/uxap/BlockBase'], function (BlockBase) {
	"use strict";

	var BlockProDetailPart1 = BlockBase.extend("zsaleorder.SharedBlocks.product.BlockProDetailPart1", {
		metadata: {
			views: {
				Collapsed: {
					viewName: "zsaleorder.SharedBlocks.product.BlockProDetailPart1",
					type: "XML"
				},
				Expanded: {
					viewName: "zsaleorder.SharedBlocks.product.BlockProDetailPart1",
					type: "XML"
				}
			}
		}
	});
	return BlockProDetailPart1;
});
