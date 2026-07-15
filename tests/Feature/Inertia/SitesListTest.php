<?php

namespace Tests\Feature\Inertia;

use App\Models\Site;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class SitesListTest extends TestCase
{
    use DatabaseMigrations;

    public function test_list_contains_sites()
    {
        $first = Site::factory()->create(['name' => 'first site']);
        $second = Site::factory()->create(['name' => 'second site']);

        $this->get('/')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Sites')
                ->has('records', 2)
                ->has('records.0', fn (AssertableInertia $page) => $page
                    ->where('id', $first->id)
                    ->where('name', $first->name)
                    ->where('domain', $first->domain)
                    ->where('url', $first->url)
                )
                ->has('records.1', fn (AssertableInertia $page) => $page
                    ->where('id', $second->id)
                    ->where('name', $second->name)
                    ->where('domain', $second->domain)
                    ->where('url', $second->url)
                )
            );
    }
}
