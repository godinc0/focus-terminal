import './dashboard.css';

interface Filter {
  id: number;
  pattern: string;
  enabled: boolean;
  createdAt: number;
}

class TerminalController {
  private filters: Filter[] = [];
  private terminalContent: HTMLElement;
  private output: HTMLElement;
  private currentInput: HTMLElement;
  private cursor: HTMLElement;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private currentCommand: string = '';

  constructor() {
    this.terminalContent = document.getElementById('terminal-content') as HTMLElement;
    this.output = document.getElementById('output') as HTMLElement;
    this.currentInput = document.getElementById('current-input') as HTMLElement;
    this.cursor = document.getElementById('cursor') as HTMLElement;
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadFilters();
    this.setupEventListeners();
    this.printWelcome();
    this.terminalContent.focus();
  }

  private setupEventListeners(): void {
    this.terminalContent.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Keep focus on terminal
    this.terminalContent.addEventListener('blur', () => {
      setTimeout(() => this.terminalContent.focus(), 0);
    });
    
    document.addEventListener('click', () => {
      this.terminalContent.focus();
    });
    
    document.getElementById('import-file')?.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      if (input.files?.[0]) {
        await this.importFilters(input.files[0]);
        input.value = '';
      }
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Handle special keys
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.currentCommand.trim()) {
        this.executeCommand(this.currentCommand);
        this.commandHistory.push(this.currentCommand);
        this.historyIndex = this.commandHistory.length;
      } else {
        this.newPrompt();
      }
      this.currentCommand = '';
      this.currentInput.textContent = '';
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.currentCommand.length > 0) {
        this.currentCommand = this.currentCommand.slice(0, -1);
        this.currentInput.textContent = this.currentCommand;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.currentCommand = this.commandHistory[this.historyIndex];
        this.currentInput.textContent = this.currentCommand;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        this.currentCommand = this.commandHistory[this.historyIndex];
        this.currentInput.textContent = this.currentCommand;
      } else {
        this.historyIndex = this.commandHistory.length;
        this.currentCommand = '';
        this.currentInput.textContent = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion could be added here
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Handle regular character input
      e.preventDefault();
      this.currentCommand += e.key;
      this.currentInput.textContent = this.currentCommand;
    }
  }


  private async executeCommand(command: string): Promise<void> {
    // Move current line to output
    const commandLine = document.createElement('div');
    commandLine.className = 'output-line command-echo';
    commandLine.innerHTML = `<span class="prompt">focus-terminal@system:~$</span> ${this.escapeHtml(command)}`;
    this.output.appendChild(commandLine);
    
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const argStr = args.join(' ').trim();

    switch (cmd) {
      case 'ls':
      case 'list':
        await this.listFilters();
        break;
        
      case 'block':
      case 'add':
        if (argStr) {
          await this.addFilter(argStr);
        } else {
          this.printError('Usage: block <url-pattern>');
        }
        break;
        
      case 'delete':
      case 'rm':
      case 'remove':
        if (argStr) {
          await this.removeFilter(argStr);
        } else {
          this.printError('Usage: delete <id|url-pattern>');
        }
        break;
        
      case 'enable':
        if (argStr) {
          await this.toggleFilter(argStr, true);
        } else {
          this.printError('Usage: enable <id|url-pattern>');
        }
        break;
        
      case 'disable':
        if (argStr) {
          await this.toggleFilter(argStr, false);
        } else {
          this.printError('Usage: disable <id|url-pattern>');
        }
        break;
        
      case 'clear':
      case 'cls':
        this.clearOutput();
        break;
        
      case 'export':
        this.exportFilters();
        break;
        
      case 'import':
        document.getElementById('import-file')?.click();
        break;
        
      case 'help':
      case '?':
        this.showHelp();
        break;
        
      case 'exit':
      case 'quit':
        window.close();
        break;
        
      default:
        this.printError(`Command not found: ${cmd}. Type 'help' for available commands.`);
    }
    
    this.scrollToBottom();
  }

  private async loadFilters(): Promise<void> {
    const response = await chrome.runtime.sendMessage({ type: 'GET_FILTERS' });
    this.filters = response || [];
  }

  private async listFilters(): Promise<void> {
    await this.loadFilters();
    
    if (this.filters.length === 0) {
      this.printLine('No filters configured.');
      return;
    }

    this.printLine(`ID   STATUS    PATTERN                          CREATED`);
    this.printLine(`---- --------- -------------------------------- ----------`);
    
    this.filters
      .sort((a, b) => a.id - b.id)
      .forEach(filter => {
        const id = String(filter.id).padEnd(4);
        const status = (filter.enabled ? '[ACTIVE]' : '[DISABLED]').padEnd(9);
        const pattern = filter.pattern.padEnd(32);
        const date = new Date(filter.createdAt).toLocaleDateString();
        this.printLine(`${id} ${status} ${pattern} ${date}`, filter.enabled ? '' : 'disabled');
      });
    
    this.printLine('');
    this.printLine(`Total: ${this.filters.length} filter(s)`);
  }

  private async addFilter(pattern: string): Promise<void> {
    if (this.filters.some(f => f.pattern === pattern)) {
      this.printError(`Filter already exists: ${pattern}`);
      return;
    }

    try {
      const filter = await chrome.runtime.sendMessage({
        type: 'ADD_FILTER',
        pattern
      });
      
      this.filters.push(filter);
      this.printSuccess(`Filter added: ${pattern} [ID: ${filter.id}]`);
    } catch (error) {
      this.printError('Failed to add filter');
    }
  }

  private async removeFilter(identifier: string): Promise<void> {
    const id = parseInt(identifier);
    let filter: Filter | undefined;
    
    if (!isNaN(id)) {
      filter = this.filters.find(f => f.id === id);
    } else {
      filter = this.filters.find(f => f.pattern === identifier);
    }
    
    if (!filter) {
      this.printError(`Filter not found: ${identifier}`);
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'REMOVE_FILTER',
        id: filter.id
      });
      
      this.filters = this.filters.filter(f => f.id !== filter.id);
      this.printSuccess(`Filter removed: ${filter.pattern}`);
    } catch (error) {
      this.printError('Failed to remove filter');
    }
  }

  private async toggleFilter(identifier: string, enable: boolean): Promise<void> {
    const id = parseInt(identifier);
    let filter: Filter | undefined;
    
    if (!isNaN(id)) {
      filter = this.filters.find(f => f.id === id);
    } else {
      filter = this.filters.find(f => f.pattern === identifier);
    }
    
    if (!filter) {
      this.printError(`Filter not found: ${identifier}`);
      return;
    }

    try {
      const updated = await chrome.runtime.sendMessage({
        type: 'TOGGLE_FILTER',
        id: filter.id
      });
      
      const index = this.filters.findIndex(f => f.id === filter.id);
      if (index !== -1 && updated) {
        this.filters[index] = updated;
        this.printSuccess(`Filter ${enable ? 'enabled' : 'disabled'}: ${filter.pattern}`);
      }
    } catch (error) {
      this.printError('Failed to toggle filter');
    }
  }

  private exportFilters(): void {
    const data = JSON.stringify(this.filters, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-terminal-filters-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.printSuccess(`Exported ${this.filters.length} filter(s)`);
  }

  private async importFilters(file: File): Promise<void> {
    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Filter[];
      let count = 0;
      
      for (const filter of imported) {
        if (!this.filters.some(f => f.pattern === filter.pattern)) {
          await chrome.runtime.sendMessage({
            type: 'ADD_FILTER',
            pattern: filter.pattern
          });
          count++;
        }
      }
      
      await this.loadFilters();
      this.printSuccess(`Imported ${count} new filter(s)`);
    } catch (error) {
      this.printError('Failed to import filters');
    }
  }

  private showHelp(): void {
    this.printLine('Available commands:');
    this.printLine('');
    this.printLine('  ls              - List all filters');
    this.printLine('  block <url>     - Add a new filter');
    this.printLine('  delete <id|url> - Remove a filter');
    this.printLine('  enable <id|url> - Enable a filter');
    this.printLine('  disable <id|url>- Disable a filter');
    this.printLine('  export          - Export filters to JSON');
    this.printLine('  import          - Import filters from JSON');
    this.printLine('  clear           - Clear terminal output');
    this.printLine('  help            - Show this help message');
    this.printLine('  exit            - Close terminal');
  }

  private clearOutput(): void {
    this.output.innerHTML = '';
  }

  private printWelcome(): void {
    this.printLine('FOCUS TERMINAL v2.0.0');
    this.printLine('Type "help" for available commands');
    this.printLine('');
  }

  private newPrompt(): void {
    const line = document.createElement('div');
    line.className = 'output-line';
    line.textContent = '';
    this.output.appendChild(line);
  }

  private printLine(text: string, className: string = ''): void {
    const line = document.createElement('div');
    line.className = `output-line ${className}`;
    line.textContent = text;
    this.output.appendChild(line);
  }

  private printSuccess(text: string): void {
    this.printLine(`[SUCCESS] ${text}`, 'success');
  }

  private printError(text: string): void {
    this.printLine(`[ERROR] ${text}`, 'error');
  }

  private scrollToBottom(): void {
    this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize terminal when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TerminalController());
} else {
  new TerminalController();
}