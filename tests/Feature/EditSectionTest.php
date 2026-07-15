<?php

namespace Tests\Feature;

use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EditSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_that_section_is_added()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);

        $response = $this->patch("/{$site->id}/section/{$section->id}", ['name' => 'new section']);

        $this->assertDatabaseHas('sections', [
            'site_id' => $site->id,
            'name' => 'new section',
        ]);
    }

    public function test_that_name_is_required()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);

        $response = $this->patch("/{$site->id}/section/{$section->id}", ['name' => '']);
        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
            'name' => $section->name,
        ]);
        $this->assertDatabaseMissing('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
            'name' => 'new section',
        ]);
    }

    public function test_that_no_section_is_updated_if_site_mismatch()
    {
        $site = Site::factory()->create();
        $site2 = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);

        $response = $this->patch("/{$site2->id}/section/{$section->id}", ['name' => 'new section']);
        $this->assertDatabaseCount('sections', 1);
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
            'name' => $section->name,
        ]);
        $this->assertDatabaseMissing('sections', [
            'name' => 'new section',
        ]);
    }
}
