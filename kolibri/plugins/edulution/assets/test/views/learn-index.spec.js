import VueRouter from 'vue-router';
import { mount } from '@vue/test-utils';
import EdulutionIndex from '../../src/views/EdulutionIndex';
import makeStore from '../makeStore';

jest.mock('kolibri.urls');

const router = new VueRouter({
  routes: [
    { path: '/recommended', name: 'RECOMMENDED' },
    { path: '/topics', name: 'TOPICS_ROOT' },
    { path: '/classes', name: 'ALL_CLASSES' },
  ],
});

function makeWrapper(options) {
  return mount(EdulutionIndex, {
    ...options,
    stubs: {
      breadcrumbs: true,
      contentUnavailablePage: true,
      CoreBase: `
        <div>
          <slot></slot>
          <slot name="sub-nav"></slot>
        </div>
      `,
      topicsPage: true,
      TotalPoints: true,
    },
    router,
  });
}

function getElements(wrapper) {
  return {
    // hrefs need to match the routes in the mock router above
    classesLink: () => wrapper.find('[href="#/classes"]'),
    recommendedLink: () => wrapper.find('[href="#/recommended"]'),
    topicsLink: () => wrapper.find('[href="#/topics"]'),
    tabLinks: () => wrapper.findAll({ name: 'KNavbarLink' }),
    CoreBase: () => wrapper.find({ name: 'CoreBase' }),
  };
}

describe('learn plugin index page', () => {
  let store;

  const setSessionUserKind = kind => {
    store.state.core.session.kind = [kind];
    store.state.core.session.user_id = 'test';
  };
  const setMemberships = memberships => {
    store.state.memberships = memberships;
  };
  const setPageName = pageName => {
    store.state.pageName = pageName;
  };

  beforeEach(() => {
    store = makeStore();
  });

  it('there are no tabs if showing content unavailable page', () => {
    setPageName('CONTENT_UNAVAILABLE');
    const wrapper = makeWrapper({ store });
    const { CoreBase } = getElements(wrapper);
    expect(CoreBase().props().showSubNav).toEqual(false);
  });

  it('the recommended and channel links are always available to everybody', () => {
    setSessionUserKind('anonymous');
    setMemberships([]);
    const wrapper = makeWrapper({ store });
    const { tabLinks, recommendedLink, topicsLink } = getElements(wrapper);
    expect(tabLinks().length).toEqual(2);
    expect(recommendedLink().is('a')).toEqual(true);
    expect(topicsLink().is('a')).toEqual(true);
  });

  it('the classes tab is available if user is logged in and has memberships', () => {
    // should work for any user 'kind' except for 'anonymous'
    setSessionUserKind('learner');
    setMemberships([{ id: 'membership_1' }]);
    const wrapper = makeWrapper({ store });
    const { classesLink, tabLinks } = getElements(wrapper);
    expect(tabLinks().length).toEqual(3);
    expect(classesLink().is('a')).toEqual(true);
  });

  it('the classes tab is not available if user is not logged in', () => {
    // in current implementation, anonymous user implies empty memberships
    setSessionUserKind('anonymous');
    setMemberships([]);
    const wrapper = makeWrapper({ store });
    const { classesLink, tabLinks } = getElements(wrapper);
    expect(tabLinks().length).toEqual(2);
    expect(!classesLink().exists()).toEqual(true);
  });

  it('the classes tab is not available if user has no memberships/classes', () => {
    setSessionUserKind('learner');
    setMemberships([]);
    const wrapper = makeWrapper({ store });
    const { classesLink, tabLinks } = getElements(wrapper);
    expect(tabLinks().length).toEqual(2);
    expect(!classesLink().exists()).toEqual(true);
  });
});