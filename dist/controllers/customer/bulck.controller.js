"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JustCheck = void 0;
const JustCheck = async (req, res, next) => {
    try {
        res.json({
            OK: "DONE",
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.JustCheck = JustCheck;
//# sourceMappingURL=bulck.controller.js.map