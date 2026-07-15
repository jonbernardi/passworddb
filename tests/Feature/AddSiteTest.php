<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddSiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_that_site_is_created()
    {
        $response = $this->post('/', [
            'name' => 'sitename',
            'domain' => 'example.com',
            'url' => 'http://example.com',
            'notes' => 'site notes',
        ]);

        $this->assertDatabaseCount('sites', 1);
        $this->assertDatabaseHas('sites', [
            'name' => 'sitename',
            'domain' => 'example.com',
            'url' => 'http://example.com',
            'notes' => 'site notes',
        ]);
    }

    public function test_that_name_is_required()
    {
        $response = $this->post('/');

        $response->assertStatus(302)
            ->assertSessionHasErrors(['name']);

        $this->assertDatabaseCount('sites', 0);
    }
}
