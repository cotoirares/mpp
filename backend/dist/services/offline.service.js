"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineService = void 0;
const data_service_1 = require("./data.service");
class OfflineService {
    constructor() {
        this.operations = [];
        this.isOnline = true;
        this.isServerAvailable = true;
        this.dataService = data_service_1.DataService.getInstance();
        this.setupNetworkDetection();
        this.setupServerDetection();
    }
    static getInstance() {
        if (!OfflineService.instance) {
            OfflineService.instance = new OfflineService();
        }
        return OfflineService.instance;
    }
    setupNetworkDetection() {
        // In a browser environment, this would use the navigator.onLine API
        // For the backend, we'll simulate network detection
        setInterval(() => {
            this.checkNetworkStatus();
        }, 5000);
    }
    setupServerDetection() {
        setInterval(() => {
            this.checkServerStatus();
        }, 5000);
    }
    checkNetworkStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('https://www.google.com');
                this.isOnline = response.ok;
            }
            catch (_a) {
                this.isOnline = false;
            }
        });
    }
    checkServerStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to perform a simple operation
                yield this.dataService.getAllPlayers({});
                this.isServerAvailable = true;
            }
            catch (_a) {
                this.isServerAvailable = false;
            }
        });
    }
    getStatus() {
        return {
            isOnline: this.isOnline,
            isServerAvailable: this.isServerAvailable,
            pendingOperations: this.operations.length
        };
    }
    queueOperation(operation) {
        return __awaiter(this, void 0, void 0, function* () {
            this.operations.push(operation);
            yield this.syncIfPossible();
            return operation;
        });
    }
    syncIfPossible() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isOnline && this.isServerAvailable) {
                const ops = [...this.operations];
                this.operations = [];
                for (const op of ops) {
                    try {
                        switch (op.type) {
                            case 'create':
                                yield this.dataService.createPlayer(op.data);
                                break;
                            case 'update':
                                if (op.id) {
                                    yield this.dataService.updatePlayer(op.id, op.data);
                                }
                                break;
                            case 'delete':
                                if (op.id) {
                                    yield this.dataService.deletePlayer(op.id);
                                }
                                break;
                        }
                    }
                    catch (error) {
                        console.error('Error syncing operation:', error);
                        this.operations.push(op);
                    }
                }
            }
        });
    }
}
exports.OfflineService = OfflineService;
