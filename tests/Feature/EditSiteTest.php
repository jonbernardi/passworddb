<?php

namespace Tests\Feature;

use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EditSiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_that_site_is_updated()
    {
        $site = Site::factory()->create();

        $response = $this->patch("/$site->id", [
            'name' => 'newname',
            'domain' => 'new.example.com',
            'url' => 'http://new.example.com',
            'notes' => 'new site notes',
        ]);

        $this->assertDatabaseHas('sites', [
            'id' => $site->id,
            'name' => 'newname',
            'domain' => 'new.example.com',
            'url' => 'http://new.example.com',
            'notes' => 'new site notes',
        ]);
    }

    public function test_that_name_is_required()
    {
        $site = Site::factory()->create();

        $response = $this->patch("/$site->id", [
            'name' => '',
            'domain' => 'new.example.com',
            'url' => 'http://new.example.com',
            'notes' => 'new site notes',
        ]);

        $response->assertStatus(302)
            ->assertSessionHasErrors(['name']);

        $this->assertDatabaseHas('sites', [
            'id' => $site->id,
            'name' => $site->name,
            'domain' => $site->domain,
            'url' => $site->url,
            'notes' => $site->notes,
        ]);

        $this->assertDatabaseMissing('sites', [
            'id' => $site->id,
            'domain' => 'new.example.com',
        ]);
    }
}
