import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';
import BoxesAssignment from '../BoxesAssignment.vue';

describe('BoxesAssignment', () => {
	it('renders properly', () => {
		const wrapper = mount(BoxesAssignment, {
			props: { msg: 'Hello Vitest' },
		});
		expect(wrapper.text()).toContain('Hello Vitest');
	});
});
