<?php

namespace Database\Factories;

use App\Models\Data;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

class DataFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Data::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->text(100),
            'data' => function () {
                $data = [];
                $num = random_int(1, 5);
                for ($i = 1; $i <= $num; $i++) {
                    $data[] = [
                        'name' => $this->faker->text(20),
                        'value' => $this->faker->text(20),
                        'type' => 'text',
                    ];
                }

                return $data;
            },
            'section_id' => fn () => Section::factory()->create()->id,
        ];
    }
}
