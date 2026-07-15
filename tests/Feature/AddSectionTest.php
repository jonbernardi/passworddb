<?php

namespace Tests\Feature;

use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_that_section_is_added()
    {
        $site = Site::factory()->create();

        $response = $this->post("/{$site->id}/section", ['name' => 'new section']);

        $this->assertDatabaseCount('sections', 1);
        $this->assertDatabaseHas('sections', [
            'site_id' => $site->id,
            'name' => 'new section',
        ]);
    }

    public function test_that_name_is_required()
    {
        $site = Site::factory()->create();
        $response = $this->post("/{$site->id}/section", ['name' => '']);
        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseCount('sections', 0);
    }
}
