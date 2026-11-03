import { createWebHistory, createRouter, type RouteLocationNormalized } from 'vue-router'

import SiteList from './components/SiteList.vue'
import SiteDetails from './components/SiteDetails.vue'

const routes = [
    { path: '/', component: SiteList, name: 'sites' },
    {
        path: '/:id',
        component: SiteDetails,
        name: 'site',
        props: (route: RouteLocationNormalized) => ({ id: Number(route.params.id), s: route.query.s }),
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})
