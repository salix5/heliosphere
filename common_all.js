/* eslint-disable no-unused-vars */
import { AutocompleteInteraction } from "discord.js";
import { complete_name_table, create_choice, escape_regexp, official_name } from "./ygo-query.mjs";
import { ruby_entries } from './common-json-loader.js';

const MAX_CHOICE = 25;
const choice_table = Object.create(null);
for (const locale of Object.keys(official_name)) {
	choice_table[locale] = create_choice(locale);
}

const jp_entries = half_width_entries(choice_table['ja']);

export { choice_table };

/**
 * @param {string} str
 * @returns
 */
function toHalfWidth(str) {
	return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

/**
 * @param {string} str
 * @returns 
 */
function toFullWidth(str) {
	return str.replace(/[A-Za-z0-9]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
}

/**
 * Check if 2 strings are case-insensitive equal.
 * @param {string} a 
 * @param {string} b 
 * @returns boolean result
 */
function is_equal(a, b) {
	return toHalfWidth(a.toLowerCase()) === toHalfWidth(b.toLowerCase());
}

function half_width_entries(choices) {
	const result = [];
	for (const [name, cid] of choices) {
		result.push([toHalfWidth(name), cid]);
	}
	return result;
}

/**
 * @param {AutocompleteInteraction} interaction 
 * @param {[string, number][]} entries 
 * @returns id list
 */
function filter_choice(interaction, entries) {
	const focused = interaction.options.getFocused().trim();
	const starts_with = [];
	const other = [];
	const keyword = escape_regexp(toHalfWidth(focused));
	const start = new RegExp(`^${keyword}`);
	const include = new RegExp(`${keyword}`);
	for (const [choice, cid] of entries) {
		if (start.test(choice))
			starts_with.push(cid);
		else if (include.test(choice))
			other.push(cid);
		if (starts_with.length >= MAX_CHOICE)
			return starts_with;
	}
	const ret = starts_with.concat(other);
	if (ret.length > MAX_CHOICE)
		ret.length = MAX_CHOICE;
	return ret;
}

/**
 * The autocomplete handler for Japanese card names, which also searches ruby.
 * @param {AutocompleteInteraction} interaction
 */
export async function autocomplete_jp(interaction) {
	const focused = interaction.options.getFocused().trim();
	if (!focused) {
		await interaction.respond([]);
		return;
	}
	const ret = filter_choice(interaction, jp_entries);
	if (ret.length < MAX_CHOICE) {
		const ruby_max_length = MAX_CHOICE - ret.length;
		const starts_with = [];
		const other = [];
		const cid_set = new Set(ret);
		const keyword = escape_regexp(focused);
		const start = new RegExp(`^${keyword}`);
		const include = new RegExp(`${keyword}`);
		for (const [ruby, cid] of ruby_entries) {
			if (cid_set.has(cid))
				continue;
			if (start.test(ruby))
				starts_with.push(cid);
			else if (include.test(ruby))
				other.push(cid);
			if (starts_with.length >= ruby_max_length)
				break;
		}
		ret.push(...starts_with);
		if (ret.length < MAX_CHOICE)
			ret.push(...other);
		if (ret.length > MAX_CHOICE)
			ret.length = MAX_CHOICE;
	}
	const name_jp = complete_name_table['ja'];
	await interaction.respond(
		ret.map(cid => ({ name: name_jp.get(cid), value: name_jp.get(cid) }))
	);
}

/**
 * The default autocomplete handler.
 * @param {AutocompleteInteraction} interaction 
 * @param {string} request_locale 
 * @returns 
 */
export async function autocomplete_default(interaction, request_locale) {
	const focused = interaction.options.getFocused().trim();
	if (!focused || !choice_table[request_locale]) {
		await interaction.respond([]);
		return;
	}
	const starts_with = [];
	const other = [];
	const keyword = escape_regexp(focused);
	const start = new RegExp(`^${keyword}`, 'i');
	const include = new RegExp(`${keyword}`, 'i');
	for (const [choice, cid] of choice_table[request_locale]) {
		if (start.test(choice))
			starts_with.push(choice);
		else if (include.test(choice))
			other.push(choice);
		if (starts_with.length >= MAX_CHOICE)
			break;
	}
	let ret;
	if (starts_with.length >= MAX_CHOICE)
		ret = starts_with;
	else
		ret = starts_with.concat(other);
	if (ret.length > MAX_CHOICE)
		ret.length = MAX_CHOICE;
	await interaction.respond(
		ret.map(choice => ({ name: choice, value: choice }))
	);
}
