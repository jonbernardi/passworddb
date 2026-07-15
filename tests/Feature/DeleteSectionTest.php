<?php

namespace Tests\Feature;

use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_that_section_is_deleted()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);

        $response = $this->delete("/{$site->id}/section/{$section->id}");

        $this->assertDatabaseCount('sections', 0);
    }

    public function test_that_no_section_is_deleted_if_id_mismatch()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);

        $response = $this->delete("/{$site->id}/section/123{$section->id}");
        $this->assertDatabaseCount('sections', 1);
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
        ]);
    }

    public function test_that_no_section_is_deleted_if_site_mismatch()
    {
        $site = Site::factory()->create();
        $site2 = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);

        $response = $this->delete("/{$site2->id}/section/{$section->id}");
        $this->assertDatabaseCount('sections', 1);
        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'site_id' => $site->id,
        ]);
    }
}
