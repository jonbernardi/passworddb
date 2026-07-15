<?php

namespace Tests\Feature;

use App\Models\Data;
use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoveRecordTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_sorting_right()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 1]);
        $record2 = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 2]);
        $record3 = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 3]);

        $response = $this->post("/{$site->id}/section/{$section->id}/data/{$record->id}/right");
        $this->assertDatabaseHas('data', [
            'id' => $record->id,
            'sort' => 2,
        ]);
        $this->assertDatabaseHas('data', [
            'id' => $record2->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('data', [
            'id' => $record3->id,
            'sort' => 3,
        ]);
    }

    public function test_record_sorting_left()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 1]);
        $record2 = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 2]);
        $record3 = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 3]);

        $response = $this->post("/{$site->id}/section/{$section->id}/data/{$record2->id}/left");
        $this->assertDatabaseHas('data', [
            'id' => $record->id,
            'sort' => 2,
        ]);
        $this->assertDatabaseHas('data', [
            'id' => $record2->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('data', [
            'id' => $record3->id,
            'sort' => 3,
        ]);
    }

    public function test_cannot_move_first_record_left()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 1]);
        $record2 = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 2]);

        $response = $this->post("/{$site->id}/section/{$section->id}/data/{$record->id}/left");
        $this->assertDatabaseHas('data', [
            'id' => $record->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('data', [
            'id' => $record2->id,
            'sort' => 2,
        ]);
    }

    public function test_cannot_move_last_record_right()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 1]);
        $record2 = Data::factory()->create(['section_id' => $section->id, 'data' => [], 'sort' => 2]);

        $response = $this->post("/{$site->id}/section/{$section->id}/data/{$record2->id}/right");
        $this->assertDatabaseHas('data', [
            'id' => $record->id,
            'sort' => 1,
        ]);
        $this->assertDatabaseHas('data', [
            'id' => $record2->id,
            'sort' => 2,
        ]);
    }
}
