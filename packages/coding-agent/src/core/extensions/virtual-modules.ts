import * as bundledPiAgentCore from "@earendil-works/3pi-agent-core";
import * as bundledPiAiCompat from "@earendil-works/3pi-ai/compat";
import * as bundledPiAiOauth from "@earendil-works/3pi-ai/oauth";
import * as bundledPiAiProviders from "@earendil-works/3pi-ai/providers/all";
import * as bundledPiTui from "@earendil-works/3pi-tui";
import * as bundledTypebox from "typebox";
import * as bundledTypeboxCompile from "typebox/compile";
import * as bundledTypeboxValue from "typebox/value";
// This import is safe because loader.ts exports are not re-exported from index.ts.
// Extensions can therefore import from @earendil-works/3pi-coding-agent.
import * as bundledPiCodingAgent from "../../index.ts";

/** Modules available to extensions in source and compiled binary runtimes. */
export const VIRTUAL_MODULES: Record<string, unknown> = {
	typebox: bundledTypebox,
	"typebox/compile": bundledTypeboxCompile,
	"typebox/value": bundledTypeboxValue,
	"@sinclair/typebox": bundledTypebox,
	"@sinclair/typebox/compile": bundledTypeboxCompile,
	"@sinclair/typebox/value": bundledTypeboxValue,
	"@earendil-works/3pi-agent-core": bundledPiAgentCore,
	"@earendil-works/3pi-tui": bundledPiTui,
	// Extensions resolve the pi-ai root to the compat entrypoint (a strict
	// superset of the core entrypoint): existing extensions using the old
	// global API keep working at runtime until compat is removed.
	"@earendil-works/3pi-ai": bundledPiAiCompat,
	"@earendil-works/3pi-ai/compat": bundledPiAiCompat,
	"@earendil-works/3pi-ai/oauth": bundledPiAiOauth,
	"@earendil-works/3pi-ai/providers/all": bundledPiAiProviders,
	"@earendil-works/3pi-coding-agent": bundledPiCodingAgent,
	"@mariozechner/pi-agent-core": bundledPiAgentCore,
	"@mariozechner/pi-tui": bundledPiTui,
	"@mariozechner/pi-ai": bundledPiAiCompat,
	"@mariozechner/pi-ai/compat": bundledPiAiCompat,
	"@mariozechner/pi-ai/oauth": bundledPiAiOauth,
	"@mariozechner/pi-ai/providers/all": bundledPiAiProviders,
	"@mariozechner/pi-coding-agent": bundledPiCodingAgent,
};
