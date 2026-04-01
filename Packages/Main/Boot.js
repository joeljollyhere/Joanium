import { AutomationEngine } from '../Features/Automation/Core/AutomationEngine.js';
import { ConnectorEngine } from '../Features/Connectors/Core/ConnectorEngine.js';
import { AgentsEngine } from '../Features/Agents/Core/AgentsEngine.js';
import { ChannelEngine } from '../Features/Channels/Core/ChannelEngine.js';
import FeatureRegistry from '../Capabilities/Core/FeatureRegistry.js';

import * as AgentsIPC from '../Features/Agents/IPC/AgentsIPC.js';
import * as AutomationIPC from '../Features/Automation/IPC/AutomationIPC.js';
import * as ChannelsIPC from '../Features/Channels/IPC/ChannelsIPC.js';
import * as MCPIPC from '../Features/MCP/IPC/MCPIPC.js';
import * as ConnectorIPC from '../Features/Connectors/IPC/ConnectorIPC.js';
import * as FeatureIPC from '../Features/Core/IPC/FeatureIPC.js';
import * as SkillsIPC from '../Features/Skills/IPC/SkillsIPC.js';
import * as BrowserPreviewIPC from '../Features/BrowserPreview/IPC/BrowserPreviewIPC.js';

import * as SetupIPC from './IPC/SetupIPC.js';
import * as UserIPC from './IPC/UserIPC.js';
import * as SystemIPC from './IPC/SystemIPC.js';
import * as ChatIPC from './IPC/ChatIPC.js';
import * as ProjectIPC from './IPC/ProjectIPC.js';
import * as WindowIPC from './IPC/WindowIPC.js';
import * as PersonasIPC from './IPC/PersonasIPC.js';
import * as UsageIPC from './IPC/UsageIPC.js';
import * as TerminalIPC from './IPC/TerminalIPC.js';

import { getBrowserPreviewService } from './Services/BrowserPreviewService.js';
import { invalidate as invalidateSystemPrompt } from './Services/SystemPromptService.js';

import Paths from './Core/Paths.js';

export async function boot() {
  const featureRegistry = await FeatureRegistry.load(Paths.FEATURES_DIR);

  const connectorEngine = new ConnectorEngine(Paths.CONNECTORS_FILE, featureRegistry);
  featureRegistry.setBaseContext({
    connectorEngine,
    paths: Paths,
    invalidateSystemPrompt,
  });

  const automationEngine = new AutomationEngine(Paths.AUTOMATIONS_FILE, connectorEngine, featureRegistry);
  const agentsEngine = new AgentsEngine(Paths.AGENTS_FILE, connectorEngine, featureRegistry);
  const channelEngine = new ChannelEngine(Paths.CHANNELS_FILE);

  const browserPreviewService = getBrowserPreviewService();

  SetupIPC.register();
  UserIPC.register();
  SystemIPC.register(connectorEngine, featureRegistry);
  ChatIPC.register();
  ProjectIPC.register();
  WindowIPC.register();
  PersonasIPC.register();
  UsageIPC.register();
  TerminalIPC.register();

  AutomationIPC.register(automationEngine);
  AgentsIPC.register(agentsEngine, automationEngine);
  ChannelsIPC.register(channelEngine);
  ConnectorIPC.register(connectorEngine, featureRegistry);
  FeatureIPC.register(featureRegistry);
  SkillsIPC.register();
  BrowserPreviewIPC.register(browserPreviewService);
  MCPIPC.register();

  return {
    featureRegistry,
    connectorEngine,
    automationEngine,
    agentsEngine,
    channelEngine,
    browserPreviewService,
  };
}

export function startEngines({ automationEngine, agentsEngine, channelEngine }) {
  automationEngine.start();
  agentsEngine.start();
  channelEngine.start();
}

export function stopEngines({ automationEngine, agentsEngine, channelEngine }) {
  automationEngine?.stop();
  agentsEngine?.stop();
  channelEngine?.stop();
}
