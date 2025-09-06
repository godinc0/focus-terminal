interface FilterRule {
  id: number;
  pattern: string;
  enabled: boolean;
  createdAt: number;
}

interface StorageSchema {
  filters: FilterRule[];
  settings: {
    strictMode: boolean;
    notifications: boolean;
  };
}

class FilteringService {
  private static instance: FilteringService;
  private activeFilters: Map<number, FilterRule> = new Map();
  private nextId: number = 1;

  private constructor() {
    this.initialize();
  }

  static getInstance(): FilteringService {
    if (!FilteringService.instance) {
      FilteringService.instance = new FilteringService();
    }
    return FilteringService.instance;
  }

  private async initialize(): Promise<void> {
    await this.loadFilters();
    this.setupMessageHandlers();
    chrome.action.onClicked.addListener(() => {
      chrome.runtime.openOptionsPage();
    });
  }

  private async loadFilters(): Promise<void> {
    const data = await chrome.storage.local.get(['filters']) as { filters?: FilterRule[] };
    const filters = data.filters || [];
    
    await this.clearAllRules();
    
    for (const filter of filters) {
      this.activeFilters.set(filter.id, filter);
      if (filter.enabled) {
        await this.applyRule(filter);
      }
    }
    
    if (filters.length > 0) {
      this.nextId = Math.max(...filters.map(f => f.id)) + 1;
    }
  }

  private async clearAllRules(): Promise<void> {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);
    
    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
    }
  }

  private async applyRule(filter: FilterRule): Promise<void> {
    const rule: chrome.declarativeNetRequest.Rule = {
      id: filter.id,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          extensionPath: '/src/pages/interceptor.html'
        }
      },
      condition: {
        urlFilter: filter.pattern,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
      }
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [rule]
    });
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request).then(sendResponse);
      return true;
    });
  }

  private async handleMessage(request: any): Promise<any> {
    switch (request.type) {
      case 'ADD_FILTER':
        return await this.addFilter(request.pattern);
      
      case 'REMOVE_FILTER':
        return await this.removeFilter(request.id);
      
      case 'TOGGLE_FILTER':
        return await this.toggleFilter(request.id);
      
      case 'GET_FILTERS':
        return Array.from(this.activeFilters.values());
      
      case 'CLEAR_ALL':
        return await this.clearAll();
      
      default:
        return { error: 'Unknown request type' };
    }
  }

  private async addFilter(pattern: string): Promise<FilterRule> {
    const filter: FilterRule = {
      id: this.nextId++,
      pattern,
      enabled: true,
      createdAt: Date.now()
    };

    this.activeFilters.set(filter.id, filter);
    await this.saveFilters();
    await this.applyRule(filter);

    return filter;
  }

  private async removeFilter(id: number): Promise<boolean> {
    if (!this.activeFilters.has(id)) {
      return false;
    }

    this.activeFilters.delete(id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [id]
    });
    await this.saveFilters();

    return true;
  }

  private async toggleFilter(id: number): Promise<FilterRule | null> {
    const filter = this.activeFilters.get(id);
    if (!filter) {
      return null;
    }

    filter.enabled = !filter.enabled;

    if (filter.enabled) {
      await this.applyRule(filter);
    } else {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [id]
      });
    }

    await this.saveFilters();
    return filter;
  }

  private async clearAll(): Promise<void> {
    await this.clearAllRules();
    this.activeFilters.clear();
    this.nextId = 1;
    await this.saveFilters();
  }

  private async saveFilters(): Promise<void> {
    const filters = Array.from(this.activeFilters.values());
    await chrome.storage.local.set({ filters });
  }
}

// Initialize service
FilteringService.getInstance();