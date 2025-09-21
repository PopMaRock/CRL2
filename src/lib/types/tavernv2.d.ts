//The oh so amazing Tavern Card V2 character spec.
//This spec encourages wastefulness and bloat which makes people push all the information into one field so 'description' becomes a massive unusable mess.
//There is no technical reason to structure data in this way but, the weebs love this shit and cunts use it so fuck it.
//TODO: CREATE A NEW CHARACTER SCHEMA TO USE - do not follow this in code
type TavernCardV2 = {
  spec: 'chara_card_v2'
  spec_version: '2.0' // May 8th addition
  data: {
    name: string //[--useful]
    description: string //[--usually a dumpster fire used by cunts to write war and peace]
    personality: string //[--be good if cunts filled this in]
    scenario: string //[--...maybe useful. Will see]
    first_mes: string //[--fine]
    mes_example: string //[--fine. add to system prompt]

    // New fields start here
    creator_notes: string //--[No one care]
    system_prompt: string //--[Nope. Will never be used]
    post_history_instructions: string //--[Not taking instructions from non technical "creators"]
    alternate_greetings: Array<string> //--[meh. pass]
    character_book?: CharacterBook //--[and a character book is? people take this too seriously]

    // May 8th additions
    tags: Array<string> //[--pish]
    creator: string //[--sure.why not]
    character_version: string //[--character versions? ok...]
    extensions: Record<string, any> //[--nope]
  }
}

/**
 * ? as in `name?: string` means the `name` property may be absent from the JSON
 * (aka this property is optional)
 * OPTIONAL PROPERTIES ARE ALLOWED TO BE UNSUPPORTED BY EDITORS AND DISREGARDED BY
 * FRONTENDS, however they must never be destroyed if already in the data. [-- pfft, bitch I'll disregard most of this shit]
 *
 * the `extensions` properties may contain arbitrary key-value pairs, but you are encouraged
 * to namespace the keys to prevent conflicts, and you must never destroy
 * unknown key-value pairs from the data. `extensions` is mandatory and must
 * default to `{}`. `extensions` exists for the character book itself, and for
 * each entry.
 **/
type CharacterBook = {
  name?: string //[--probably the only useful field]
  description?: string //[--the variable used by everyone to dump 1000 words of shite into]
  scan_depth?: number // agnai: "Memory: Chat History Depth" [--fuck knows. More shite]
  token_budget?: number // agnai: "Memory: Context Limit" [--how the fuck is this useful? Calculate it at edit or prompt]
  recursive_scanning?: boolean // no agnai equivalent. whether entry content can trigger other entries [--fuck knows, don't care]
  extensions: Record<string, any> //[--force shit into this so the weebs don't get upset when I ruin the schema]
  entries: Array<{ //[-- ignore all this pish]
    keys: Array<string>
    content: string
    extensions: Record<string, any>
    enabled: boolean
    insertion_order: number // if two entries inserted, lower "insertion order" = inserted higher
    case_sensitive?: boolean

    // FIELDS WITH NO CURRENT EQUIVALENT IN SILLY [--the fuck is "Silly"? Is the world shortening SillyTavern to 'Silly' these days? God help us...]
    name?: string // not used in prompt engineering
    priority?: number // if token budget reached, lower priority value = discarded first [--ignore]

    // FIELDS WITH NO CURRENT EQUIVALENT IN AGNAI
    id?: number // not used in prompt engineering [--bullshit. Also "prompt engineering"? The art of using natural language to instruct an LLM is not a skill]
    comment?: string // not used in prompt [--bullshit]
    selective?: boolean // if `true`, require a key from both `keys` and `secondary_keys` to trigger the entry [--bullshit]
    secondary_keys?: Array<string> // see field `selective`. ignored if selective == false [--bullshit]
    constant?: boolean // if true, always inserted in the prompt (within budget limit) [--fuck off]
    position?: 'before_char' | 'after_char' // whether the entry is placed before or after the character defs [--no happening]
  }>
}